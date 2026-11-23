if (Sesion.token()) location.replace("index.html");

const form = document.getElementById("registerForm");
const formError = document.getElementById("formError");
const submitBtn = document.getElementById("submitBtn");
const val = (id) => document.getElementById(id).value;

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  formError.hidden = true;

  if (val("password") !== val("password2")) {
    formError.textContent = "Las contraseñas no coinciden.";
    formError.hidden = false;
    return;
  }

  const email = val("email").trim();
  submitBtn.disabled = true;
  submitBtn.textContent = "Creando cuenta…";

  try {
    await apiFetch("/api/Auth/register", {
      method: "POST",
      body: { nombre: val("nombre").trim(), apellido: val("apellido").trim(), email, password: val("password") },
    });
    // Inicio de sesión automático
    const data = await apiFetch("/api/Auth/login", { method: "POST", body: { email, password: val("password") } });
    Sesion.guardar(data, email);
    location.href = "index.html";
  } catch (e) {
    formError.textContent = e.message;
    formError.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Crear cuenta";
  }
});
