montarNav();
if (exigirRol(["Administrador"])) {
  const yo = Sesion.id();
  let roles = [];
  let rolesDe = new Map(); // usuarioId -> [nombres de rol]

  async function gestionarRoles(usuario, recargar) {
    const actuales = new Set(rolesDe.get(usuario.usuarioId) ?? []);
    const error = el("p", { class: "form-error", hidden: true });

    const lista = roles.map((r) => {
      const esMiAdmin = usuario.usuarioId === yo && r.nombre === "Administrador";
      const chk = el("input", { type: "checkbox", checked: actuales.has(r.nombre), disabled: esMiAdmin });
      chk.addEventListener("change", async () => {
        error.hidden = true; chk.disabled = true;
        try {
          await apiFetch(`/api/Usuarios/${usuario.usuarioId}/roles/${r.rolId}`, { method: chk.checked ? "POST" : "DELETE" });
          chk.checked ? actuales.add(r.nombre) : actuales.delete(r.nombre);
        } catch (e) {
          chk.checked = !chk.checked; error.textContent = e.message; error.hidden = false;
        } finally { chk.disabled = false; }
      });
      return el("label", { class: "check" }, chk,
        el("span", {}, el("strong", { text: r.nombre }), r.descripcion ? el("small", { text: r.descripcion }) : null));
    });

    const dlg = modal(`Roles de ${usuario.nombre} ${usuario.apellido}`, lista, error);
    dlg.addEventListener("close", recargar);
  }

  crearCrud({
    root: document.getElementById("contenido"),
    titulo: "Usuarios", singular: "usuario", textoNuevo: "Nuevo usuario",
    endpoint: "/api/Usuarios", id: "usuarioId",
    preparar: async () => { roles = await apiFetch("/api/Roles"); },
    filtro: async (filas) => {
      const pares = await Promise.all(filas.map(async (u) =>
        [u.usuarioId, (await apiFetch(`/api/Usuarios/${u.usuarioId}/roles`)).map((r) => r.nombre)]));
      rolesDe = new Map(pares);
      return filas;
    },
    buscar: (u) => `${u.nombre} ${u.apellido} ${u.email} ${(rolesDe.get(u.usuarioId) ?? []).join(" ")}`,
    columnas: [
      { k: "usuarioId", t: "ID" },
      { k: "nombre", t: "Nombre", f: (v, u) => `${u.nombre} ${u.apellido}` },
      { k: "email", t: "Correo" },
      { k: "usuarioId", t: "Roles", f: (id) => el("div", { class: "chips" },
          (rolesDe.get(id) ?? []).map((n) => el("span", { class: "badge badge--role", text: n }))) },
      { k: "fechaRegistro", t: "Registro", f: fmtFecha },
    ],
    campos: [
      { k: "nombre", t: "Nombre", req: true, max: 100 },
      { k: "apellido", t: "Apellido", req: true, max: 100 },
      { k: "email", t: "Correo electrónico", tipo: "email", req: true, max: 254 },
      { k: "password", t: "Contraseña (mín. 6 caracteres)", tipo: "password", req: true, minLen: 6, soloNuevo: true },
    ],
    // Crear usuarios pasa por /api/Auth/register para que la contraseña se guarde con hash BCrypt
    crear: (u) => apiFetch("/api/Auth/register", { method: "POST", body: u }),
    acciones: [{ t: "Roles", fn: gestionarRoles }],
    puedeCrear: true, puedeEditar: true, puedeBorrar: true,
    puedeBorrarFila: (u) => u.usuarioId !== yo,
  });
}
