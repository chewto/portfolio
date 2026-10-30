import { strings } from "../i18n.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function initContact() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const honeypot = form.querySelector("[data-honeypot]");
  const submitButton = form.querySelector('button[type="submit"]');

  form.noValidate = true;

  const fields = {
    name: {
      input: form.querySelector("#name"),
      validate(value) {
        if (!value.trim()) return strings.form.nameRequired;
        if (value.trim().length < 2) return strings.form.nameShort;
        return "";
      },
    },
    email: {
      input: form.querySelector("#email"),
      validate(value) {
        if (!value.trim()) return strings.form.emailRequired;
        if (!EMAIL_RE.test(value.trim())) return strings.form.emailInvalid;
        return "";
      },
    },
    message: {
      input: form.querySelector("#message"),
      validate(value) {
        if (!value.trim()) return strings.form.messageRequired;
        if (value.trim().length < 20) return strings.form.messageShort;
        return "";
      },
    },
  };

  const setStatus = (message, type = "") => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-success", type === "success");
    status.classList.toggle("is-error", type === "error");
  };

  const showError = (key, message) => {
    const field = fields[key];
    if (!field?.input) return;
    const error = form.querySelector(`[data-error-for="${key}"]`);
    field.input.setAttribute("aria-invalid", message ? "true" : "false");
    if (error) error.textContent = message;
  };

  const validateField = (key) => {
    const field = fields[key];
    if (!field?.input) return "";
    const message = field.validate(field.input.value);
    showError(key, message);
    return message;
  };

  Object.entries(fields).forEach(([key, field]) => {
    if (!field.input) return;
    field.input.addEventListener("input", () => {
      if (field.input.getAttribute("aria-invalid") === "true") {
        validateField(key);
      }
    });
    field.input.addEventListener("blur", () => {
      if (field.input.value.trim() !== "") validateField(key);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (honeypot && honeypot.value.trim() !== "") return;

    const errors = Object.keys(fields).map((key) => ({ key, message: validateField(key) }));
    const firstError = errors.find((error) => error.message);

    if (firstError) {
      setStatus(strings.form.review, "error");
      fields[firstError.key]?.input?.focus();
      return;
    }

    const name = fields.name.input.value.trim();
    const email = fields.email.input.value.trim();
    const message = fields.message.input.value.trim();

    const subject = strings.mail.subject.replace("{name}", name);
    const body = [
      strings.mail.greeting,
      "",
      message,
      "",
      "—",
      `${strings.mail.nameLabel}: ${name}`,
      `${strings.mail.emailLabel}: ${email}`,
    ].join("\r\n");

    const mailto = `mailto:jesuselozada@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setStatus(strings.form.opening, "success");
    window.location.href = mailto;

    if (submitButton) {
      submitButton.dataset.state = "ready";
    }
  });
}
