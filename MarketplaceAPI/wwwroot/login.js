// ==========================================================
// Configuración
// ==========================================================
// Debe coincidir con applicationUrl de Properties/launchSettings.json (perfil "https").
// Servido por la API (F5 en Visual Studio): mismo origen, no necesita URL.
// Si abres el frontend con Live Server (puerto 5500), apunta a la API.
const API_BASE = location.port === "5500" ? "https://localhost:7028" : "";

const TOKEN_KEY = "token";
const USER_KEY = "userEmail";
const USER_INFO_KEY = "userInfo";      // { usuarioId, nombre, roles }
const EXPIRES_KEY = "tokenExpiresAt";  // ISO string que devuelve la API

// ==========================================================
// Referencias al DOM
// ==========================================================
const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");

// ==========================================================
// Sesión
// ==========================================================
function sesionVigente() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  const expira = localStorage.getItem(EXPIRES_KEY);
  // La API siempre envía expiresAt (UTC). Si venció, limpiamos todo.
  if (expira && new Date(expira).getTime() <= Date.now()) {
    [TOKEN_KEY, USER_KEY, USER_INFO_KEY, EXPIRES_KEY].forEach((k) => localStorage.removeItem(k));
    return false;
  }
  return true;
}

// Si ya hay sesión vigente, no tiene sentido ver el login
if (sesionVigente()) {
  window.location.replace("index.html");
}

// ==========================================================
// Validación
// ==========================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mostrarError(input, el, mensaje) {
  el.textContent = mensaje;
  el.hidden = !mensaje;
  input.classList.toggle("is-invalid", Boolean(mensaje));
}

function validar(email, password) {
  const errorEmail = !email
    ? "Ingresa tu correo electrónico."
    : !EMAIL_REGEX.test(email)
    ? "Escribe un correo válido, por ejemplo nombre@correo.com."
    : "";

  const errorPassword = !password
    ? "Ingresa tu contraseña."
    : password.length < 6
    ? "La contraseña debe tener al menos 6 caracteres."
    : "";

  mostrarError(emailInput, emailError, errorEmail);
  mostrarError(passwordInput, passwordError, errorPassword);

  return !errorEmail && !errorPassword;
}

// ==========================================================
// API  ->  POST /api/Auth/login
// Request:  { email, password }
// Response: { token, expiresAt, usuarioId, nombre, roles[] }
// ==========================================================
async function iniciarSesion(email, password) {
  let response;
  try {
    response = await fetch(`${API_BASE}/api/Auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    // fetch solo rechaza por fallos de red, certificado HTTPS o CORS
    console.error("Fallo de red/CORS:", error);
    throw new Error(
      "No se pudo conectar con el servidor. Verifica que la API esté corriendo."
    );
  }

  if (response.status === 401) {
    throw new Error("Correo o contraseña incorrectos.");
  }
  if (response.status === 400) {
    throw new Error("Datos inválidos. Revisa tu correo y contraseña.");
  }
  if (!response.ok) {
    throw new Error("No pudimos iniciar sesión. Intenta de nuevo en unos minutos.");
  }

  return response.json();
}

// ==========================================================
// Envío del formulario
// ==========================================================
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.hidden = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!validar(email, password)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Confirmando…";

  try {
    const data = await iniciarSesion(email, password);

    if (!data?.token) {
      throw new Error("La respuesta del servidor no incluyó un token.");
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(EXPIRES_KEY, data.expiresAt);
    localStorage.setItem(USER_KEY, email);
    localStorage.setItem(
      USER_INFO_KEY,
      JSON.stringify({
        usuarioId: data.usuarioId,
        nombre: data.nombre,
        roles: data.roles ?? [],
      })
    );

    window.location.href = "index.html";
  } catch (error) {
    formError.textContent = error.message;
    formError.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Confirmar";
  }
});

// Limpia el error de cada campo al escribir
emailInput.addEventListener("input", () => mostrarError(emailInput, emailError, ""));
passwordInput.addEventListener("input", () => mostrarError(passwordInput, passwordError, ""));
