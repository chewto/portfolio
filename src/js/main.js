import { initNav } from "./modules/nav.js";
import { initReveal } from "./modules/reveal.js";
import { initSpotlight } from "./modules/spotlight.js";
import { initContact } from "./modules/contact.js";
import { initUI } from "./modules/ui.js";
import { initLangSwitch } from "./modules/lang.js";

const init = () => {
  document.documentElement.classList.add("js");
  initNav();
  initReveal();
  initSpotlight();
  initContact();
  initUI();
  initLangSwitch();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
