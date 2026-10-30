function initCv() {
  document.querySelectorAll("[data-print]").forEach((button) => {
    button.addEventListener("click", () => window.print());
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCv, { once: true });
} else {
  initCv();
}
