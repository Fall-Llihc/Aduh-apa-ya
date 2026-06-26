"""
BBC News Classifier - FastAPI Backend
Provides /classify endpoint that returns prediction + per-word category weights.
"""
import json
import os
import re
from pathlib import Path
from typing import List, Optional

import joblib
import numpy as np
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── NLTK setup ─────────────────────────────────────────────────────────
for pkg in ["stopwords", "punkt", "punkt_tab", "wordnet"]:
    try:
        nltk.download(pkg, quiet=True)
    except Exception:
        pass

# ── Load artifacts ─────────────────────────────────────────────────────
ART = Path(__file__).parent / "artifacts"
if not ART.exists():
    raise RuntimeError(f"artifacts/ folder not found at {ART}. Run notebook first.")

tfidf = joblib.load(ART / "tfidf.pkl")
model = joblib.load(ART / "model.pkl")
with open(ART / "feature_weights.json") as f:
    fw_data = json.load(f)

CLASSES = fw_data["classes"]
FEATURE_WEIGHTS = fw_data["features"]

# Build a flat lookup: word -> {category: weight, ...}
WORD_CATEGORY_MAP = {}
for cat, items in FEATURE_WEIGHTS.items():
    for item in items:
        w = item["word"]
        WORD_CATEGORY_MAP.setdefault(w, {})[cat] = item["weight"]

# ── Preprocessing (identical to training) ──────────────────────────────
BASE_SW = set(stopwords.words("english"))
CUSTOM_SW = {
    "said", "says", "say", "mr", "mrs", "ms", "also", "would", "could",
    "one", "two", "three", "four", "five", "year", "years", "people",
    "told", "us", "last", "first", "new", "time", "will", "may", "much",
    "many", "still", "even", "going", "get", "got", "like", "back",
    "good", "well", "just", "make", "made", "way", "now", "however",
    "though", "although", "despite", "bbc", "added", "per", "cent",
    "expected", "including", "according",
}
ALL_SW = BASE_SW | CUSTOM_SW
LEMMA = WordNetLemmatizer()


def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"http\S+|www\S+|\d+|[^a-z\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    tokens = [
        LEMMA.lemmatize(t)
        for t in word_tokenize(text)
        if t not in ALL_SW and len(t) > 2
    ]
    return " ".join(tokens)


def tokenize_with_positions(original: str):
    """Tokenize original text preserving offsets so frontend can highlight."""
    tokens = []
    for match in re.finditer(r"\b[a-zA-Z]+\b", original):
        word = match.group()
        lemma_form = LEMMA.lemmatize(word.lower())
        tokens.append({
            "original": word,
            "lemma": lemma_form,
            "start": match.start(),
            "end": match.end(),
        })
    return tokens


# ── Translation (optional) ─────────────────────────────────────────────
def maybe_translate(text: str) -> dict:
    """
    Detect language and translate if not English.
    Uses deep_translator (free, no API key).
    """
    try:
        from langdetect import detect
        from deep_translator import GoogleTranslator

        lang = detect(text)
        if lang == "en":
            return {"translated": False, "language": "en", "text": text, "original": text}
        translated = GoogleTranslator(source="auto", target="en").translate(text)
        return {
            "translated": True,
            "language": lang,
            "text": translated,
            "original": text,
        }
    except Exception as e:
        # If translation fails, just use the original text
        return {
            "translated": False,
            "language": "unknown",
            "text": text,
            "original": text,
            "error": str(e),
        }


# ── App setup ──────────────────────────────────────────────────────────
app = FastAPI(
    title="BBC News Classifier API",
    description="TF-IDF + Stacking Ensemble for BBC News classification",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ─────────────────────────────────────────────────────────────
class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    auto_translate: bool = Field(default=True)


class WordHighlight(BaseModel):
    word: str
    start: int
    end: int
    categories: List[dict]


class ClassifyResponse(BaseModel):
    prediction: str
    confidence: float
    probabilities: dict
    translation: dict
    highlights: List[WordHighlight]
    classes: List[str]


# ── Endpoints ───────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "name": "BBC News Classifier API",
        "endpoints": ["/health", "/classify"],
        "classes": CLASSES,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "classes": CLASSES,
        "val_accuracy": fw_data["metadata"].get("val_accuracy"),
    }


@app.post("/classify", response_model=ClassifyResponse)
def classify(req: ClassifyRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty text")

    # Step 1: maybe translate
    if req.auto_translate:
        tr = maybe_translate(text)
    else:
        tr = {"translated": False, "language": "en", "text": text, "original": text}

    analyzed_text = tr["text"]

    # Step 2: classify
    cleaned = preprocess(analyzed_text)
    if not cleaned:
        raise HTTPException(status_code=400, detail="Text has no usable content after cleaning")

    X = tfidf.transform([cleaned])

    # Get class probabilities (use decision_function as fallback for non-prob models)
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
    else:
        scores = model.decision_function(X)[0]
        # softmax
        exp_scores = np.exp(scores - np.max(scores))
        probs = exp_scores / exp_scores.sum()

    pred_idx = int(np.argmax(probs))
    pred_class = CLASSES[pred_idx]
    confidence = float(probs[pred_idx])
    prob_dict = {CLASSES[i]: float(probs[i]) for i in range(len(CLASSES))}

    # Step 3: word-level highlights
    tokens = tokenize_with_positions(analyzed_text)
    highlights = []
    RELEVANCE_THRESHOLD = 0.15  # min normalized weight to render highlight
    DOMINANCE_RATIO = 0.50      # if 2nd-best < 50% of top, use single color

    # Pre-compute per-category max weight for normalization
    max_per_cat = {
        cat: max((item["weight"] for item in FEATURE_WEIGHTS[cat]), default=1.0)
        for cat in CLASSES
    }

    for tok in tokens:
        lemma = tok["lemma"]
        if lemma not in WORD_CATEGORY_MAP:
            continue
        cat_weights = WORD_CATEGORY_MAP[lemma]

        # Normalize weights to 0-1 within each category
        normalized = []
        for cat, w in cat_weights.items():
            norm = w / max_per_cat[cat] if max_per_cat[cat] > 0 else 0
            if norm >= RELEVANCE_THRESHOLD:
                normalized.append({"category": cat, "weight": float(w), "normalized": float(norm)})

        if not normalized:
            continue

        # Sort by normalized weight desc
        normalized.sort(key=lambda x: x["normalized"], reverse=True)

        # Decide: single vs split
        if len(normalized) == 1:
            kept = normalized[:1]
        else:
            top = normalized[0]
            second = normalized[1]
            if second["normalized"] / top["normalized"] >= DOMINANCE_RATIO:
                # Split highlight (two categories)
                kept = normalized[:2]
            else:
                # Single dominant category
                kept = normalized[:1]

        highlights.append({
            "word": tok["original"],
            "start": tok["start"],
            "end": tok["end"],
            "categories": kept,
        })

    return {
        "prediction": pred_class,
        "confidence": confidence,
        "probabilities": prob_dict,
        "translation": tr,
        "highlights": highlights,
        "classes": CLASSES,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
