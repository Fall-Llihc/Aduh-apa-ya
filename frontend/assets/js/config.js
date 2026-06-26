// ┌─────────────────────────────────────────────────────────────────┐
// │ Backend API URL — ganti setelah deploy backend                   │
// │                                                                  │
// │ Hugging Face Spaces: https://USERNAME-SPACENAME.hf.space         │
// │ Railway:             https://YOUR-APP.up.railway.app             │
// │ Render:              https://YOUR-APP.onrender.com               │
// │ Local dev:           http://localhost:7860                       │
// └─────────────────────────────────────────────────────────────────┘
const CONFIG = {
  API_URL: "https://fall1hc-bbc-news-classifier-api.hf.space",

  CATEGORY_META: {
    business:      { icon: "ti-briefcase",      label: "business" },
    entertainment: { icon: "ti-movie",          label: "entertainment" },
    politics:      { icon: "ti-building-bank",  label: "politics" },
    sport:         { icon: "ti-ball-football",  label: "sport" },
    tech:          { icon: "ti-device-laptop",  label: "tech" },
  },

  CATEGORY_COLORS: {
    business:      { main: "#378ADD", bg: "#E6F1FB", text: "#042C53" },
    entertainment: { main: "#D4537E", bg: "#FBEAF0", text: "#4B1528" },
    politics:      { main: "#BA7517", bg: "#FAEEDA", text: "#412402" },
    sport:         { main: "#7F77DD", bg: "#EEEDFE", text: "#26215C" },
    tech:          { main: "#1D9E75", bg: "#E1F5EE", text: "#04342C" },
  },
};
