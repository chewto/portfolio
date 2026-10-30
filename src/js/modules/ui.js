import { strings } from "../i18n.js";

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-9999px";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function initUI() {
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const live = document.querySelector("#copy-status");

  document.querySelectorAll("[data-copy]").forEach((button) => {
    const label = button.querySelector("[data-copy-label]");
    const original = label?.textContent ?? "";

    button.addEventListener("click", async () => {
      const value = button.dataset.copy || "";
      const ok = await copyText(value);

      if (live) {
        live.textContent = ok ? strings.copy.status : strings.copy.failure;
      }

      if (!label) return;
      label.textContent = ok ? strings.copy.copied : strings.copy.error;
      window.setTimeout(() => {
        label.textContent = original;
      }, 2200);
    });
  });
}
