(function () {
  const $container = document.getElementById("resultContainer");

  const raw = sessionStorage.getItem("classifyResult");
  if (!raw) {
    $container.innerHTML = `
      <div class="result-main-card">
        <p class="muted">No result to show. <a href="./index.html">Try classifying some text first.</a></p>
      </div>`;
    return;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    $container.innerHTML = `<div class="result-main-card"><p class="muted">Result data is corrupted.</p></div>`;
    return;
  }

  const pred = data.prediction;
  const meta = CONFIG.CATEGORY_META[pred] || { icon: "ti-help", label: pred };
  const sortedProbs = Object.entries(data.probabilities).sort((a, b) => b[1] - a[1]);

  // Build highlighted text HTML
  const analyzedText = data.translation.text;
  const highlights = (data.highlights || []).slice().sort((a, b) => a.start - b.start);
  const highlightedHTML = buildHighlightedHTML(analyzedText, highlights);

  // Translation banner (only if translated)
  let translationBlock = "";
  if (data.translation.translated) {
    const origText = escapeHtml(data.translation.original);
    translationBlock = `
      <div class="translation-banner">
        <i class="ti ti-language"></i>
        <div>
          <p>Translated from <span class="lang-code">${escapeHtml(data.translation.language)}</span> to English for analysis. The highlights below apply to the translated text.</p>
        </div>
      </div>
      <div class="text-block">
        <p class="text-block-label">Original (${escapeHtml(data.translation.language)})</p>
        <div class="text-original">${origText}</div>
      </div>
      <div class="text-block">
        <p class="text-block-label">Translated (analyzed)</p>
        <div class="text-analyzed">${highlightedHTML}</div>
      </div>`;
  } else {
    translationBlock = `
      <div class="text-block">
        <p class="section-label">Highlighted input</p>
        <div class="text-analyzed">${highlightedHTML}</div>
      </div>`;
  }

  // Sidebar: confidence breakdown
  const sidebarHTML = `
    <div class="result-sidebar">
      <p class="section-label">Confidence breakdown</p>
      <div class="confidence-list">
        ${sortedProbs.map(([cat, p]) => `
          <div class="conf-row">
            <span class="conf-label">${cat}</span>
            <div class="conf-bar-track">
              <div class="conf-bar-fill cat-${cat}" style="width: ${(p * 100).toFixed(1)}%;"></div>
            </div>
            <span class="conf-value">${(p * 100).toFixed(1)}%</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Main card
  $container.innerHTML = `
    <div class="result-main-card cat-${pred}">
      <div class="result-header">
        <div class="result-icon cat-${pred}">
          <i class="ti ${meta.icon}"></i>
        </div>
        <div>
          <p class="section-label" style="margin-bottom:4px;">Predicted category</p>
          <h2 class="result-title">${pred}</h2>
          <p class="result-subtitle">${(data.confidence * 100).toFixed(1)}% confidence</p>
        </div>
      </div>
      ${translationBlock}
    </div>
    ${sidebarHTML}
  `;

  function buildHighlightedHTML(text, hls) {
    if (!hls.length) return escapeHtml(text);
    let result = "";
    let cursor = 0;
    for (const h of hls) {
      if (h.start < cursor) continue;
      result += escapeHtml(text.slice(cursor, h.start));
      result += renderMark(text.slice(h.start, h.end), h.categories);
      cursor = h.end;
    }
    result += escapeHtml(text.slice(cursor));
    return result;
  }

  function renderMark(word, cats) {
    const safeWord = escapeHtml(word);
    if (!cats.length) return safeWord;
    const top = cats[0];
    const opacity = (0.30 + 0.60 * top.normalized).toFixed(2);

    if (cats.length === 1) {
      const color = CONFIG.CATEGORY_COLORS[top.category];
      const bg = hexToRgba(color.bg, opacity);
      const tooltip = `${top.category} · weight ${top.weight.toFixed(2)}`;
      return `<mark class="highlight cat-${top.category}" style="background-color:${bg};" data-tooltip="${escapeHtml(tooltip)}">${safeWord}</mark>`;
    } else {
      // Split
      const colorA = CONFIG.CATEGORY_COLORS[cats[0].category];
      const colorB = CONFIG.CATEGORY_COLORS[cats[1].category];
      const opacityB = (0.30 + 0.60 * cats[1].normalized).toFixed(2);
      const bgA = hexToRgba(colorA.bg, opacity);
      const bgB = hexToRgba(colorB.bg, opacityB);
      const tooltip = `${cats[0].category} (${cats[0].weight.toFixed(2)}) + ${cats[1].category} (${cats[1].weight.toFixed(2)})`;
      const style = `--split-color-a:${bgA}; --split-color-b:${bgB};`;
      return `<mark class="highlight split" style="${style}" data-tooltip="${escapeHtml(tooltip)}">${safeWord}</mark>`;
    }
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
})();
