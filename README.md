# Aduh, apa ya? — BBC News Classifier

Demo interaktif klasifikasi teks berita BBC ke dalam 5 kategori menggunakan TF-IDF + Stacking Ensemble. Validation accuracy 97.99%.

🔗 **Live demo**: [your-pages-url]
📰 **Categories**: business, entertainment, politics, sport, tech

## Fitur

- ✨ Klasifikasi instan dengan confidence per kategori
- 🌈 Word-level highlighting — kata diskriminatif diberi warna sesuai kategorinya
- 🎨 Split highlight untuk kata multi-kategori (misalnya "game" → sport + tech)
- 🌐 Auto-translate input non-English ke English sebelum klasifikasi
- 📊 Halaman Model Details untuk transparansi pipeline

## Struktur Repo

```
.
├── frontend/                    # Static HTML/CSS/JS (deploy ke GitHub Pages)
│   ├── index.html               # Halaman input
│   ├── result.html              # Halaman hasil klasifikasi
│   ├── model.html               # Halaman detail model
│   └── assets/
│       ├── css/styles.css
│       └── js/
│           ├── config.js        # ⚠ Edit API_URL setelah deploy backend
│           ├── main.js
│           ├── result.js
│           └── model.js
│
├── backend/                     # FastAPI inference server (deploy ke HF Spaces)
│   ├── app.py                   # API endpoint /classify
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── README.md                # Wajib untuk HF Space metadata
│   └── artifacts/               # ⚠ Letakkan PKL hasil training di sini
│       ├── model.pkl
│       ├── tfidf.pkl
│       └── feature_weights.json
│
├── notebooks/
│   └── train_model.ipynb        # Notebook untuk generate PKL
│
├── docs/
│   └── DEPLOYMENT.md            # Panduan deployment step-by-step
│
└── .github/workflows/
    └── deploy.yml               # Auto-deploy frontend ke GH Pages
```

## Quick Start

### 1. Generate model files
```bash
# Buka notebooks/train_model.ipynb di Kaggle / Colab
# Run all → download artifacts.zip → extract ke backend/artifacts/
```

### 2. Test backend locally
```bash
cd backend
pip install -r requirements.txt
python app.py
# Buka http://localhost:7860/docs untuk Swagger UI
```

### 3. Test frontend locally
```bash
cd frontend
# Pakai server statis apapun, misalnya:
python -m http.server 8000
# Buka http://localhost:8000
```

### 4. Deploy ke produksi
Ikuti panduan lengkap di [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## Teknologi

**Frontend**: Vanilla HTML + CSS + JS, Tabler Icons, Inter font
**Backend**: FastAPI, scikit-learn, NLTK
**Hosting**: GitHub Pages (frontend) + Hugging Face Spaces (backend)
**Model**: Stacking Ensemble (LinearSVC + ComplementNB + LogisticRegression) dengan meta-learner LogisticRegression

## Lisensi

MIT — bebas digunakan untuk keperluan akademik dan pembelajaran.

## Kredit

Tugas Besar Text Mining — Kelompok 8 'Aduh'
- Sarah Aisyah (103052300022)
- Arkhan Falih Fahrie P (103052330051)
- Richad Fernando (1305223004)

S1 Sains Data, Fakultas Informatika, Universitas Telkom — 2026
