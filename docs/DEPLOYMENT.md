# 🚀 Deployment Guide — Aduh, apa ya?

Panduan lengkap deploy text classifier ke produksi: **frontend gratis di GitHub Pages**, **backend gratis di Hugging Face Spaces**.

---

## 📋 Apakah Perlu Backend?

**Iya, wajib.** Alasannya:
- File model PKL (~5–20 MB) ditambah library scikit-learn perlu runtime Python untuk inference
- GitHub Pages hanya host file statis (HTML/CSS/JS) — tidak bisa jalankan Python
- Konversi model scikit-learn ke browser-native (ONNX, TF.js) ribet dan tidak support StackingClassifier dengan baik

Jadi arsitekturnya:
```
[GitHub Pages: HTML/JS/CSS]  ←→  [Hugging Face Space: FastAPI + model.pkl]
       (frontend statis)              (backend Python inference)
```

---

## 🆓 Backend Free Hosting — Selain Railway

| Platform | Free tier | Cold start | Catatan |
|---|---|---|---|
| **Hugging Face Spaces** ⭐ | Unlimited hours, no sleep | ~10s on first hit | **Rekomendasi utama** untuk ML demo. Native support Docker + scikit-learn. Tidak sleep setelah idle. |
| Render.com | 750 jam/bulan | 30-60s setelah sleep 15 menit idle | Bagus, tapi sleep terus |
| Fly.io | $5 free credit/bulan | ~5s | Perlu kartu kredit verifikasi |
| Vercel/Netlify | ❌ no Python ML | — | Hanya serverless functions, scikit-learn terlalu besar |
| Google Cloud Run | 2 juta requests/bulan | ~5s | Perlu setup GCP, ribet |
| PythonAnywhere | 1 web app gratis | None (always-on) | Tidak support Docker, install manual |

**Pilihan terbaik: Hugging Face Spaces** karena tidak sleep dan native untuk ML.

---

## STEP 1 — Generate Model Files (PKL)

### Opsi A: Jalankan di Kaggle (rekomendasi, cepat & gratis)

1. Upload `BBC_news_train.csv` sebagai Kaggle Dataset
2. Buat notebook baru, upload `notebooks/train_model.ipynb`
3. Add dataset ke notebook → ganti path di sel 2:
   ```python
   df = pd.read_csv('/kaggle/input/<nama-dataset>/BBC_news_train.csv')
   ```
4. Run All Cells (sekitar 3–5 menit)
5. Download `artifacts.zip` dari panel Output

### Opsi B: Jalankan di Google Colab

1. Upload notebook ke Colab
2. Run All — dataset akan otomatis didownload via gdown
3. Setelah selesai, download 3 file dari `/content/artifacts/` (di tab Files sebelah kiri)

### Setelah punya file:
Pindahkan 3 file ke `backend/artifacts/`:
- `model.pkl`
- `tfidf.pkl`
- `feature_weights.json`

---

## STEP 2 — Deploy Backend ke Hugging Face Spaces

### 2.1 Daftar / Login
Buka https://huggingface.co dan buat akun (gratis, cukup email).

### 2.2 Buat Space Baru
1. Klik avatar pojok kanan atas → **New Space**
2. Isi:
   - **Space name**: `bbc-news-classifier-api` (atau bebas)
   - **License**: MIT
   - **Space SDK**: pilih **Docker** → **Blank**
   - **Visibility**: Public (gratis)
3. Klik **Create Space**

### 2.3 Upload File Backend
Ada 2 cara:

**Cara A: Web UI (paling mudah)**
1. Di Space, klik tab **Files** → **Add file** → **Upload files**
2. Upload semua isi folder `backend/`:
   - `app.py`
   - `requirements.txt`
   - `Dockerfile`
   - `README.md`
   - Seluruh folder `artifacts/` (drag & drop folder)
3. Commit dengan pesan "Initial deploy"

**Cara B: Git CLI (jika file besar)**
```bash
cd backend
git init
git lfs install
git lfs track "*.pkl"
git add .gitattributes
git remote add origin https://huggingface.co/spaces/<username>/bbc-news-classifier-api
git add .
git commit -m "Initial deploy"
git push -u origin main
```

### 2.4 Tunggu Build (~5 menit)
Tab **Logs** akan menampilkan progress Docker build. Selesai jika muncul `Uvicorn running on http://0.0.0.0:7860`.

### 2.5 Catat URL Backend
URL Space-mu akan berbentuk:
```
https://<username>-bbc-news-classifier-api.hf.space
```
Test dengan buka di browser → harusnya muncul JSON `{"name": "BBC News Classifier API", ...}`.

---

## STEP 3 — Deploy Frontend ke GitHub Pages

### 3.1 Update API URL
Buka `frontend/assets/js/config.js`, ganti `API_URL`:
```javascript
const CONFIG = {
  API_URL: "https://<username>-bbc-news-classifier-api.hf.space",
  // ...
};
```

### 3.2 Push ke GitHub
```bash
# Dari root project
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<username>/<repo-name>.git
git push -u origin main
```

### 3.3 Enable GitHub Pages
1. Di repo GitHub, buka **Settings** → **Pages**
2. **Source**: GitHub Actions
3. Workflow `.github/workflows/deploy.yml` sudah disediakan — akan otomatis deploy isi folder `frontend/` ke Pages tiap kali push ke `main`
4. Tunggu ~1 menit, lalu cek tab **Actions** untuk progress

### 3.4 Akses Website
URL Pages akan berbentuk:
```
https://<username>.github.io/<repo-name>/
```
Atau jika repo bernama `<username>.github.io`, langsung di `https://<username>.github.io/`.

---

## STEP 4 — Test End-to-End

1. Buka frontend di browser
2. Paste contoh teks atau klik salah satu example chip
3. Klik **Classify**
4. Harusnya redirect ke `result.html` dengan kategori, confidence breakdown, dan word highlights

### Jika gagal:
- Buka DevTools (F12) → tab **Console** untuk lihat error
- Cek `CONFIG.API_URL` di `config.js` benar
- Cek Hugging Face Space sudah running (tab Logs di HF)
- Cek CORS — backend sudah disetel `allow_origins=["*"]` jadi seharusnya OK

---

## STEP 5 — (Opsional) Domain Custom

GitHub Pages support custom domain gratis (cuma perlu domain sendiri):
1. Settings → Pages → **Custom domain**: masukkan `yourdomain.com`
2. Di DNS provider: tambah CNAME record ke `<username>.github.io`
3. Tunggu propagasi (max 24 jam)
4. Tick **Enforce HTTPS**

---

## 🐛 Troubleshooting

### Backend
- **Build gagal di Hugging Face**: cek `requirements.txt` apakah versi compatible. Coba hapus version pinning.
- **502 Bad Gateway**: Space-nya crash. Cek tab Logs. Biasanya karena file PKL tidak ke-upload.
- **CORS error di browser**: pastikan `CORSMiddleware` di `app.py` aktif (sudah disetel di template).

### Frontend
- **"Could not reach the classifier"**: API_URL salah atau backend down. Buka `<API_URL>/health` langsung di browser untuk test.
- **GitHub Pages 404**: workflow belum jalan atau gagal. Cek tab Actions.
- **Highlight tidak muncul**: kata input tidak ada di top-80 feature weights tiap kategori. Coba kata yang lebih spesifik seperti "company", "match", "film".

---

## 📊 Update Model

Setiap kali retrain model:
1. Re-run notebook → dapat PKL baru
2. Upload ke HF Space (replace file `artifacts/`)
3. HF akan otomatis rebuild Docker
4. Frontend tidak perlu diubah

---

## 💰 Biaya Total

**Rp 0** — semua gratis selamanya:
- GitHub Pages: gratis unlimited
- Hugging Face Spaces: gratis 2 vCPU + 16GB RAM, no sleep
- Domain: cuma kalau mau custom (~Rp 150k/tahun di Niagahoster)
