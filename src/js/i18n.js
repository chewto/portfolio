const dictionaries = {
  en: {
    nav: {
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
    },
    copy: {
      status: "Information copied to the clipboard.",
      failure: "Could not copy automatically. Select the text manually.",
      copied: "Copied",
      error: "Error",
    },
    form: {
      nameRequired: "Please enter your name so I can reply.",
      nameShort: "Your name must be at least 2 characters.",
      emailRequired: "Please enter your email address.",
      emailInvalid: "Enter a valid email, for example name@domain.com.",
      messageRequired: "Tell me briefly what you need.",
      messageShort: "Add a little more context (at least 20 characters).",
      review: "Please check the highlighted fields before continuing.",
      opening: "Opening your email client with the message ready to send…",
    },
    mail: {
      subject: "Portfolio contact — {name}",
      greeting: "Hi Jesús,",
      nameLabel: "Name",
      emailLabel: "Email",
    },
  },
  es: {
    nav: {
      openMenu: "Abrir menú de navegación",
      closeMenu: "Cerrar menú de navegación",
    },
    copy: {
      status: "Información copiada al portapapeles.",
      failure: "No se pudo copiar automáticamente. Selecciona el texto manualmente.",
      copied: "Copiado",
      error: "Error",
    },
    form: {
      nameRequired: "Escribe tu nombre para poder responderte.",
      nameShort: "El nombre debe tener al menos 2 caracteres.",
      emailRequired: "Escribe tu correo electrónico.",
      emailInvalid: "Introduce un correo válido, por ejemplo nombre@dominio.com.",
      messageRequired: "Cuéntame brevemente qué necesitas.",
      messageShort: "Añade un poco más de contexto (mínimo 20 caracteres).",
      review: "Revisa los campos marcados antes de continuar.",
      opening: "Abriendo tu cliente de correo con el mensaje preparado…",
    },
    mail: {
      subject: "Contacto desde el portafolio — {name}",
      greeting: "Hola Jesús,",
      nameLabel: "Nombre",
      emailLabel: "Email",
    },
  },
};

const isSpanish = document.documentElement.lang.toLowerCase().startsWith("es");

export const strings = dictionaries[isSpanish ? "es" : "en"];
