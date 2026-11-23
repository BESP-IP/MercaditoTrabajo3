"use strict";
// ==========================================================
// Utilidades compartidas por todas las páginas
// ==========================================================
// Servido por la API (F5 en Visual Studio): mismo origen, no necesita URL.
// Si abres el frontend con Live Server (puerto 5500), apunta a la API.
const API_BASE = location.port === "5500" ? "https://localhost:7028" : "";

const CLAVES = { token: "token", email: "userEmail", info: "userInfo", exp: "tokenExpiresAt" };

const Sesion = {
  limpiar() { Object.values(CLAVES).forEach((k) => localStorage.removeItem(k)); },
  token() {
    const t = localStorage.getItem(CLAVES.token);
    if (!t) return null;
    const exp = localStorage.getItem(CLAVES.exp);
    if (exp && new Date(exp).getTime() <= Date.now()) { this.limpiar(); return null; }
    return t;
  },
  info() {
    if (!this.token()) return null;
    try { return JSON.parse(localStorage.getItem(CLAVES.info)); } catch { return null; }
  },
  id() { return this.info()?.usuarioId ?? null; },
  tieneRol(...roles) { return Boolean(this.info()?.roles?.some((r) => roles.includes(r))); },
  esAdmin() { return this.tieneRol("Administrador"); },
  guardar(data, email) {
    localStorage.setItem(CLAVES.token, data.token);
    localStorage.setItem(CLAVES.exp, data.expiresAt);
    localStorage.setItem(CLAVES.email, email);
    localStorage.setItem(CLAVES.info, JSON.stringify({
      usuarioId: data.usuarioId, nombre: data.nombre, roles: data.roles ?? [],
    }));
  },
};

// ---------- DOM ----------
function el(tag, props = {}, ...hijos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (k in n) n[k] = v;
    else n.setAttribute(k, v);
  }
  n.append(...hijos.flat().filter((h) => h != null && h !== false));
  return n;
}

// ---------- Formato ----------
const fmtPrecio = (n) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n ?? 0);
const fmtFecha = (s) =>
  s ? new Date(s).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" }) : "—";

function insignia(texto) {
  const t = (texto ?? "").toLowerCase();
  const tipo = ["pagado", "completada"].includes(t) ? "ok"
    : ["cancelada", "rechazado"].includes(t) ? "bad" : "warn";
  return el("span", { class: `badge badge--${tipo}`, text: texto ?? "—" });
}

// ---------- Avisos y modales ----------
let _toastTimer;
function aviso(mensaje, esError = false) {
  let t = document.getElementById("toast");
  if (!t) { t = el("div", { id: "toast", class: "toast", role: "status" }); document.body.append(t); }
  t.textContent = mensaje;
  t.classList.toggle("toast--error", esError);
  t.hidden = false;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => (t.hidden = true), 3200);
}

function modal(titulo, ...contenido) {
  const dlg = el("dialog", { class: "modal" },
    el("div", { class: "modal__head" },
      el("h3", { text: titulo }),
      el("button", { class: "modal__x", type: "button", "aria-label": "Cerrar", text: "×", onclick: () => dlg.close() })),
    el("div", { class: "modal__body" }, ...contenido));
  dlg.addEventListener("close", () => dlg.remove());
  document.body.append(dlg);
  dlg.showModal();
  return dlg;
}

// ---------- Cliente HTTP ----------
async function mensajeError(res) {
  let txt = "";
  try { txt = await res.text(); } catch { /* sin cuerpo */ }
  try {
    const j = JSON.parse(txt);
    if (j?.errors) return Object.values(j.errors).flat().join(" ");
    if (j?.title) return j.title;
  } catch { /* no era JSON */ }
  if (res.status === 500) return "El servidor no pudo completar la operación (¿el registro está en uso o duplicado?).";
  return txt || `Error ${res.status}`;
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const token = Sesion.token();
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    console.error("Fallo de red/CORS:", e);
    throw new Error("No se pudo conectar con el servidor.");
  }

  if (res.status === 401) {
    if (token) { Sesion.limpiar(); location.href = "login.html"; }
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }
  if (res.status === 403) throw new Error("No tienes permisos para realizar esta acción.");
  if (!res.ok) throw new Error(await mensajeError(res));
  if (res.status === 204) return null;
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

// ---------- Navegación ----------
const MENU = [
  { href: "index.html", t: "Catálogo" },
  { href: "compras.html", t: "Compras", auth: true },
  { href: "detalles.html", t: "Detalles", auth: true },
  { href: "productos.html", t: "Productos", roles: ["Administrador", "Vendedor"] },
  { href: "categorias.html", t: "Categorías", roles: ["Administrador"] },
  { href: "usuarios.html", t: "Usuarios", roles: ["Administrador"] },
  { href: "roles.html", t: "Roles", roles: ["Administrador"] },
];

// Dibuja la barra superior y devuelve el contenedor de sesión (por si la página quiere añadir botones)
function montarNav() {
  const logueado = Boolean(Sesion.token());
  const actual = location.pathname.split("/").pop() || "index.html";

  const nav = el("nav", { class: "nav", "aria-label": "Principal" },
    MENU.filter((m) => (!m.auth || logueado) && (!m.roles || Sesion.tieneRol(...m.roles)))
      .map((m) => el("a", {
        href: m.href, class: "nav__link" + (m.href === actual ? " is-active" : ""),
        text: m.href === "compras.html" && !Sesion.esAdmin() ? "Mis compras" : m.t,
      })));

  const nombre = Sesion.info()?.nombre;
  const boton = el("button", {
    class: "btn btn--dark", type: "button", text: logueado ? "Cerrar sesión" : "Iniciar sesión",
    onclick: () => {
      if (logueado) { Sesion.limpiar(); location.href = "index.html"; }
      else location.href = "login.html";
    },
  });
  const sesion = el("div", { class: "session" },
    nombre ? el("span", { class: "session__name", text: `Hola, ${nombre}` }) : null, boton);

  document.getElementById("topbar").replaceChildren(
    el("a", { class: "brand", href: "index.html" }, el("span", { class: "brand__dot" }), "Tienda"),
    nav, sesion);
  return sesion;
}

// Redirige al login si no hay sesión; muestra aviso si falta el rol. Devuelve true si se puede continuar.
function exigirRol(roles) {
  if (!Sesion.token()) { location.replace("login.html"); return false; }
  if (roles && !Sesion.tieneRol(...roles)) {
    document.getElementById("contenido").replaceChildren(
      el("p", { class: "empty", text: "No tienes permisos para ver esta página." }));
    return false;
  }
  return true;
}

const opcionesTexto = (lista) => lista.map((x) => ({ v: x, t: x }));

// ==========================================================
// Motor CRUD genérico (tabla + buscador + formulario en modal)
// ==========================================================
function crearCrud(cfg) {
  let filas = [];
  const estado = el("p", { class: "section-head__status", role: "status" });
  const tbody = el("tbody");
  const buscador = el("input", {
    type: "search", class: "input-search", placeholder: "Buscar…", "aria-label": "Buscar",
    oninput: () => pintar(),
  });

  const columnas = cfg.columnas;
  const tabla = el("table", { class: "table" },
    el("thead", {}, el("tr", {},
      columnas.map((c) => el("th", { text: c.t })),
      el("th", { class: "col-acciones", text: "Acciones" }))),
    tbody);

  cfg.root.replaceChildren(...[
    el("div", { class: "section-head" }, el("h2", { text: cfg.titulo }), estado),
    cfg.nota ? el("p", { class: "nota", text: cfg.nota }) : null,
    el("div", { class: "toolbar" }, buscador,
      cfg.puedeCrear ? el("button", {
        class: "btn btn--primary", type: "button", text: cfg.textoNuevo, onclick: () => abrirForm(null),
      }) : null),
    el("div", { class: "table-wrap" }, tabla)].filter(Boolean));

  function pintar() {
    const q = buscador.value.trim().toLowerCase();
    const vis = q
      ? filas.filter((f) => (cfg.buscar ? cfg.buscar(f) : Object.values(f).join(" ")).toLowerCase().includes(q))
      : filas;

    tbody.replaceChildren(...vis.map((f) => {
      const acciones = [
        ...(cfg.acciones ?? []).filter((a) => !a.visible || a.visible(f)).map((a) =>
          el("button", { class: "btn btn--ghost btn--sm", type: "button", text: a.t, onclick: () => a.fn(f, cargar) })),
        cfg.puedeEditar ? el("button", { class: "btn btn--ghost btn--sm", type: "button", text: "Editar", onclick: () => abrirForm(f) }) : null,
        cfg.puedeBorrar && (!cfg.puedeBorrarFila || cfg.puedeBorrarFila(f))
          ? el("button", { class: "btn btn--danger btn--sm", type: "button", text: "Eliminar", onclick: () => borrar(f) }) : null,
      ];
      return el("tr", {},
        columnas.map((c) => el("td", {}, (c.f ? c.f(f[c.k], f) : f[c.k]) ?? "—")),
        el("td", { class: "col-acciones" }, el("div", { class: "acciones" }, acciones)));
    }));

    if (!vis.length) {
      tbody.replaceChildren(el("tr", {}, el("td", { colSpan: columnas.length + 1, class: "empty", text: "No hay registros para mostrar." })));
    }
    estado.textContent = `${vis.length} registro${vis.length === 1 ? "" : "s"}`;
  }

  async function cargar() {
    estado.textContent = "Cargando…";
    try {
      if (cfg.preparar) await cfg.preparar();
      let datos = await apiFetch(cfg.endpoint);
      if (cfg.filtro) datos = await cfg.filtro(datos);
      filas = datos.sort((a, b) => (cfg.descendente ? b[cfg.id] - a[cfg.id] : a[cfg.id] - b[cfg.id]));
      pintar();
    } catch (e) {
      console.error(e);
      estado.textContent = e.message;
    }
  }

  async function guardar(fila, datos) {
    if (!fila) {
      const nuevo = cfg.antesGuardar?.(datos, true) ?? datos;
      if (cfg.crear) await cfg.crear(nuevo);
      else await apiFetch(cfg.endpoint, { method: "POST", body: nuevo });
    } else {
      const cuerpo = { ...fila, ...datos };
      const final = cfg.antesGuardar?.(cuerpo, false) ?? cuerpo;
      await apiFetch(`${cfg.endpoint}/${fila[cfg.id]}`, { method: "PUT", body: final });
    }
  }

  async function borrar(fila) {
    if (!confirm("¿Eliminar este registro? Esta acción no se puede deshacer.")) return;
    try {
      if (cfg.eliminar) await cfg.eliminar(fila);
      else await apiFetch(`${cfg.endpoint}/${fila[cfg.id]}`, { method: "DELETE" });
      aviso("Registro eliminado");
      await cargar();
    } catch (e) { aviso(e.message, true); }
  }

  async function abrirForm(fila) {
    const esNuevo = !fila;
    const campos = cfg.campos.filter((c) => (esNuevo ? !c.soloLectura : !c.soloNuevo));

    const controles = await Promise.all(campos.map(async (c) => {
      const valor = fila?.[c.k] ?? c.defecto ?? "";
      let ctl;
      if (c.tipo === "select") {
        const ops = typeof c.opciones === "function" ? await c.opciones() : c.opciones;
        ctl = el("select", { id: `f_${c.k}` },
          el("option", { value: "", text: "Selecciona…" }),
          ops.map((o) => el("option", { value: o.v, text: o.t })));
        if (valor !== "" && !ops.some((o) => String(o.v) === String(valor))) ctl.append(el("option", { value: valor, text: String(valor) }));
        ctl.value = valor;
      } else if (c.tipo === "textarea") {
        ctl = el("textarea", { id: `f_${c.k}`, rows: 3, maxLength: c.max, value: valor });
      } else {
        ctl = el("input", {
          id: `f_${c.k}`, type: c.soloLectura ? "text" : (c.tipo ?? "text"), value: c.soloLectura && c.f ? c.f(valor, fila) : valor,
          maxLength: c.tipo === "number" ? null : c.max, min: c.min, step: c.step,
          minLength: c.minLen, autocomplete: c.tipo === "password" ? "new-password" : "off",
        });
      }
      ctl.required = Boolean(c.req);
      ctl.disabled = Boolean(c.soloLectura);
      return { c, ctl };
    }));

    const error = el("p", { class: "form-error", role: "alert", hidden: true });
    const enviar = el("button", { class: "btn btn--primary", type: "submit", text: "Guardar" });
    const form = el("form", {},
      controles.map(({ c, ctl }) => el("div", { class: "field" }, el("label", { for: `f_${c.k}`, text: c.t }), ctl)),
      error,
      el("div", { class: "modal__actions" },
        el("button", { class: "btn btn--ghost", type: "button", text: "Cancelar", onclick: () => dlg.close() }), enviar));

    const dlg = modal(esNuevo ? cfg.textoNuevo : `Editar ${cfg.singular}`, form);

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const datos = {};
      for (const { c, ctl } of controles) {
        if (c.soloLectura) continue;
        let v = ctl.value;
        if (c.tipo === "number" || c.numero) v = v === "" ? null : Number(v);
        else { v = v.trim(); if (v === "" && !c.req) v = null; }
        datos[c.k] = v;
      }
      enviar.disabled = true; error.hidden = true;
      try {
        await guardar(fila, datos);
        dlg.close();
        aviso(esNuevo ? "Registro creado" : "Cambios guardados");
        await cargar();
      } catch (e) {
        error.textContent = e.message; error.hidden = false; enviar.disabled = false;
      }
    });
  }

  cargar();
  return { recargar: cargar };
}
