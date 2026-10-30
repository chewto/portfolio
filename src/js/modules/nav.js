import { strings } from "../i18n.js";

const MOBILE_QUERY = "(max-width: 1040px)";

export function initNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  const navLinks = [...document.querySelectorAll("[data-nav-link]")];

  if (!header || !toggle || !panel) return;

  const mobileQuery = window.matchMedia(MOBILE_QUERY);

  const setOpen = (open, { restoreFocus = false } = {}) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? strings.nav.closeMenu : strings.nav.openMenu);
    panel.dataset.open = String(open);
    document.body.classList.toggle("menu-open", open);

    if (open) {
      const firstLink = panel.querySelector("a");
      firstLink?.focus({ preventScroll: true });
    } else if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  header.addEventListener("click", (event) => {
    if (event.target.closest("a") && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false, { restoreFocus: true });
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (toggle.getAttribute("aria-expanded") !== "true") return;
    if (header.contains(event.target)) return;
    setOpen(false);
  });

  mobileQuery.addEventListener("change", (event) => {
    if (!event.matches && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
    }
  });

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute("href") === `#${id}`;
      if (isMatch) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const sections = [...document.querySelectorAll("main section[id]")];
  if ("IntersectionObserver" in window && sections.length) {
    const activeSections = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSections.set(entry.target.id, entry.intersectionRatio);
          } else {
            activeSections.delete(entry.target.id);
          }
        });

        if (activeSections.size === 0) return;
        const [id] = [...activeSections.entries()].sort((a, b) => b[1] - a[1])[0];
        setActive(id);
      },
      { rootMargin: "-38% 0px -52% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    sections.forEach((section) => observer.observe(section));
  }

  let frame = 0;
  const onScroll = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      header.classList.toggle("is-scrolled", window.scrollY > 14);
      frame = 0;
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
