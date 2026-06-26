(function () {
  const $input = document.getElementById("inputText");
  const $btn = document.getElementById("classifyBtn");
  const $clear = document.getElementById("clearBtn");
  const $count = document.getElementById("charCount");
  const $err = document.getElementById("errorBox");
  const $loading = document.getElementById("loadingBox");
  const $examples = document.querySelectorAll(".example-chip");

  function updateCount() {
    const n = $input.value.length;
    $count.textContent = `${n} character${n === 1 ? "" : "s"}`;
  }

  $input.addEventListener("input", updateCount);
  updateCount();

  $clear.addEventListener("click", () => {
    $input.value = "";
    $input.focus();
    updateCount();
    $err.classList.add("hidden");
  });

  $examples.forEach((chip) => {
    chip.addEventListener("click", () => {
      $input.value = chip.dataset.example;
      $input.focus();
      updateCount();
    });
  });

  function showError(msg) {
    $err.textContent = msg;
    $err.classList.remove("hidden");
    $loading.classList.add("hidden");
    $btn.disabled = false;
  }

  $btn.addEventListener("click", async () => {
    const text = $input.value.trim();
    if (!text) {
      showError("Enter some text first.");
      return;
    }
    if (text.length < 8) {
      showError("Text is too short to classify meaningfully. Try at least one full sentence.");
      return;
    }

    $err.classList.add("hidden");
    $loading.classList.remove("hidden");
    $btn.disabled = true;

    try {
      const res = await fetch(`${CONFIG.API_URL}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, auto_translate: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      sessionStorage.setItem("classifyResult", JSON.stringify(data));
      sessionStorage.setItem("classifyInput", text);
      window.location.href = "./result.html";
    } catch (e) {
      showError(`Could not reach the classifier: ${e.message}. Make sure the backend is running and CONFIG.API_URL is set correctly.`);
    }
  });

  $input.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      $btn.click();
    }
  });
})();
