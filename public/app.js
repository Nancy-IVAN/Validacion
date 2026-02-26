const form = document.getElementById("formRegistro");
const statusEl = document.getElementById("status");
const btnEnviar = document.getElementById("btnEnviar");

let captchaA = 0, captchaB = 0;

// Mostrar estado general
function setStatus(msg) {
  statusEl.textContent = msg;
}

// Generar captcha
function genCaptcha() {
  captchaA = Math.floor(Math.random() * 9) + 1;
  captchaB = Math.floor(Math.random() * 9) + 1;

  document.getElementById("captchaPregunta").textContent =
    `${captchaA} + ${captchaB} = ?`;

  document.getElementById("captcha").value = "";
}

genCaptcha();

// Mostrar error por campo
function showFieldError(name, msg) {
  const el = document.querySelector(`[data-error-for="${name}"]`);
  if (el) el.textContent = msg || "";
}

// Limpiar errores
function clearAllErrors() {
  document.querySelectorAll(".error")
    .forEach(e => e.textContent = "");
}

// Mensajes HTML5
function messageFromValidity(input) {
  if (input.validity.valueMissing)
    return "Este campo es obligatorio.";
  if (input.validity.typeMismatch && input.type === "email")
    return "Escribe un correo válido (ej. nombre@dominio.com).";
  if (input.validity.patternMismatch)
    return "Formato inválido. Revisa los requisitos.";
  if (input.validity.tooShort)
    return `Debe tener al menos ${input.minLength} caracteres.`;
  if (input.validity.tooLong)
    return `Debe tener máximo ${input.maxLength} caracteres.`;

  return "Valor inválido.";
}

// Envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAllErrors();
  setStatus("");

  // 1) Validación HTML
  const inputs = Array.from(form.querySelectorAll("input"));
  let ok = true;

  for (const input of inputs) {
    if (input.name === "website") continue; // honeypot

    if (!input.checkValidity()) {
      ok = false;
      showFieldError(input.name, messageFromValidity(input));
    }
  }

  // 2) Coherencia passwords
  const p1 = document.getElementById("password").value;
  const p2 = document.getElementById("password2").value;

  if (p1 && p2 && p1 !== p2) {
    ok = false;
    showFieldError("password2", "Las contraseñas no coinciden.");
  }

  // 3) Captcha
  const captcha = document.getElementById("captcha").value.trim();
  if (Number(captcha) !== captchaA + captchaB) {
    ok = false;
    showFieldError("captcha", "Respuesta incorrecta.");
    genCaptcha();
  }

  if (!ok) {
    setStatus("Corrige los campos marcados e intenta de nuevo.");
    return;
  }

  // 4) Enviar al servidor
  const payload = {
    nombre: document.getElementById("nombre").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    password: p1,
    password2: p2,
    terminos: document.getElementById("terminos").checked,
    website: document.getElementById("website").value.trim(),
    captcha: Number(captcha),
    captchaExpected: captchaA + captchaB // solo demo
  };

  btnEnviar.disabled = true;
  setStatus("Enviando...");

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      if (data?.errors) {
        for (const [field, msg] of Object.entries(data.errors)) {
          showFieldError(field, msg);
        }
      }
      setStatus(data?.message || "Error al registrar.");
    } else {
      setStatus("✅ Registro exitoso (demo).");
      form.reset();
      genCaptcha();
    }

  } catch (error) {
    setStatus("Error de red. Revisa el servidor.");
  } finally {
    btnEnviar.disabled = false;
  }
});