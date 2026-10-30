/**
 * Keeps the current section when switching between the English and Spanish
 * versions of the portfolio. Both versions share the same section ids.
 */
export function initLangSwitch() {
  const links = [...document.querySelectorAll("[data-lang-switch]")];
  if (!links.length) return;

  const sync = () => {
    const hash = window.location.hash;
    links.forEach((link) => {
      const url = new URL(link.getAttribute("href"), window.location.href);
      url.hash = hash;
      link.setAttribute("href", url.href);
    });
  };

  sync();
  window.addEventListener("hashchange", sync);
}
