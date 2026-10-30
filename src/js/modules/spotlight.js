export function initSpotlight() {
  const cards = [...document.querySelectorAll("[data-spotlight]")];
  if (!cards.length) return;

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!finePointer || reducedMotion) return;

  cards.forEach((card) => {
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const render = () => {
      card.style.setProperty("--mx", `${pointerX}px`);
      card.style.setProperty("--my", `${pointerY}px`);
      frame = 0;
    };

    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        pointerX = event.clientX - rect.left;
        pointerY = event.clientY - rect.top;
        if (!frame) frame = window.requestAnimationFrame(render);
      },
      { passive: true },
    );
  });
}
