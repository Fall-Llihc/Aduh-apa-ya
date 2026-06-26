(function () {
  const $grid = document.getElementById("topWordsGrid");

  fetch(`${CONFIG.API_URL}/health`)
    .then((r) => r.json())
    .catch(() => null);

  // Show top words — these are baked into the data, fetched from /classify metadata
  // For demo simplicity, use a static fallback that matches the notebook results
  const TOP_WORDS = {
    business: ["firm", "company", "bank", "economic", "investment", "market", "business", "investor", "price", "economy", "growth", "share", "sales"],
    entertainment: ["film", "star", "show", "singer", "music", "album", "actor", "band", "song", "festival", "award", "movie", "director"],
    politics: ["blair", "party", "labour", "minister", "tory", "secretary", "election", "straw", "britain", "common", "government", "vote", "policy"],
    sport: ["match", "coach", "champion", "game", "player", "club", "team", "win", "season", "olympic", "league", "final", "score"],
    tech: ["computer", "user", "technology", "software", "online", "net", "speed", "game", "use", "using", "phone", "mobile", "device"],
  };

  $grid.innerHTML = Object.entries(TOP_WORDS).map(([cat, words]) => {
    const meta = CONFIG.CATEGORY_META[cat];
    return `
      <div class="tw-card cat-${cat}">
        <div class="tw-card-header">
          <i class="ti ${meta.icon}"></i>
          <span>${cat}</span>
        </div>
        <div class="tw-words">
          ${words.map((w) => `<span class="tw-word">${w}</span>`).join("")}
        </div>
      </div>
    `;
  }).join("");
})();
