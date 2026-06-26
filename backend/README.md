---
title: BBC News Classifier API
emoji: 📰
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# BBC News Classifier API

FastAPI backend for the BBC News Classification frontend.

## Endpoints
- `GET /` — info
- `GET /health` — health check
- `POST /classify` — classify text and return per-word highlights

## Files needed in `artifacts/`
- `model.pkl` — Stacking ensemble
- `tfidf.pkl` — TF-IDF vectorizer
- `feature_weights.json` — per-category feature weights for highlighting
