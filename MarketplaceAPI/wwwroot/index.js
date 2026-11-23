// ==========================================================
// Catálogo + carrito (usa common.js)
// ==========================================================
const grid = document.getElementById("productGrid");
const statusEl = document.getElementById("status");

let productos = [];
let categoriasPorId = new Map();

const sesionEl = montarNav();
const btnCarrito = el("button", { class: "btn btn--ghost", type: "button", onclick: () => abrirCarrito() });
sesionEl.prepend(btnCarrito);
btnCarrito.hidden = !Sesion.token();

// ---------- Carrito (guardado por usuario en este navegador) ----------
const claveCarrito = () => `carrito_${Sesion.id()}`;

function leerCarrito() {
  try { return JSON.parse(localStorage.getItem(claveCarrito())) ?? []; } catch { return []; }
}
function guardarCarrito(c) {
  localStorage.setItem(claveCarrito(), JSON.stringify(c));
  actualizarBoton();
}
function actualizarBoton() {
  const n = leerCarrito().reduce((s, i) => s + i.n, 0);
  btnCarrito.textContent = n ? `Carrito (${n})` : "Carrito";
}

function agregar(p) {
  if (!Sesion.token()) { location.href = "login.html"; return; }
  const carrito = leerCarrito();
  const item = carrito.find((i) => i.id === p.productoId);
  if (item) {
    if (item.n >= p.stock) { aviso("Ya tienes todo el stock disponible en el carrito.", true); return; }
    item.n++;
  } else carrito.push({ id: p.productoId, n: 1 });
  guardarCarrito(carrito);
  aviso(`"${p.nombre}" agregado al carrito`);
}

async function finalizarCompra(items, total) {
  // Tienda virtual: el único medio de pago es tarjeta (demo: se da por aprobado).
  const compra = await apiFetch("/api/Compras", {
    method: "POST",
    body: {
      compradorId: Sesion.id(), fechaCompra: new Date().toISOString(), total, metodoPago: "Tarjeta", estadoPago: "Pagado", estadoCompra: "Completada",
    },
  });
  for (const { it, p } of items) {
    await apiFetch("/api/DetallesCompra", {
      method: "POST",
      body: { compraId: compra.compraId, productoId: p.productoId, cantidad: it.n, precioUnitario: p.precio, subtotal: it.n * p.precio },
    });
  }
  guardarCarrito([]);
}

function abrirCarrito() {
  const cuerpo = el("div");
  const dlg = modal("Tu carrito", cuerpo);

  const pintar = () => {
    const carrito = leerCarrito();
    const items = carrito.map((it) => ({ it, p: productos.find((x) => x.productoId === it.id) })).filter((x) => x.p);
    if (!items.length) {
      cuerpo.replaceChildren(el("p", { class: "empty", text: "Tu carrito está vacío." }));
      return;
    }
    const cambiar = (it, delta, p) => {
      const nuevo = it.n + delta;
      if (nuevo > p.stock) { aviso("No hay más stock disponible.", true); return; }
      guardarCarrito(carrito.map((i) => i.id === it.id ? { ...i, n: nuevo } : i).filter((i) => i.n > 0));
      pintar();
    };
    const total = items.reduce((s, { it, p }) => s + it.n * p.precio, 0);

    const error = el("p", { class: "form-error", role: "alert", hidden: true });
    const confirmar = el("button", {
      class: "btn btn--primary btn--block", type: "button", text: "Pagar con tarjeta",
      onclick: async () => {
        confirmar.disabled = true; confirmar.textContent = "Procesando…"; error.hidden = true;
        try {
          await finalizarCompra(items, total);
          dlg.close();
          aviso("¡Compra realizada! Puedes verla en «Mis compras».");
        } catch (e) {
          error.textContent = e.message; error.hidden = false;
          confirmar.disabled = false; confirmar.textContent = "Pagar con tarjeta";
        }
      },
    });

    cuerpo.replaceChildren(
      ...items.map(({ it, p }) => el("div", { class: "cart-line" },
        el("div", { class: "cart-line__info" },
          el("strong", { text: p.nombre }), el("small", { text: `${fmtPrecio(p.precio)} c/u` })),
        el("div", { class: "qty" },
          el("button", { class: "btn btn--ghost btn--sm", type: "button", "aria-label": "Quitar uno", text: "−", onclick: () => cambiar(it, -1, p) }),
          el("span", { text: it.n }),
          el("button", { class: "btn btn--ghost btn--sm", type: "button", "aria-label": "Agregar uno", text: "+", onclick: () => cambiar(it, 1, p) })),
        el("strong", { class: "cart-line__sub", text: fmtPrecio(it.n * p.precio) }))),
      el("div", { class: "cart-total" }, el("span", { text: "Total" }), el("strong", { text: fmtPrecio(total) })),
      el("p", { class: "nota", text: "Pago con tarjeta." }),
      error, confirmar);
  };
  pintar();
}

// ---------- Catálogo ----------
function colorParaId(id) { return `hsl(${(id * 47) % 360} 45% 42%)`; }

function crearTarjeta(p) {
  const media = el("div", { class: "card__media", "aria-hidden": "true", style: `background:${colorParaId(p.productoId)}` });
  if (p.imagenUrl) {
    media.classList.add("card__media--img");
    media.append(el("img", { src: p.imagenUrl, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }));
  }
  media.append(document.createTextNode(p.nombre.charAt(0).toUpperCase()));

  const categoria = categoriasPorId.get(p.categoriaId);
  return el("article", { class: "card" }, media,
    el("div", { class: "card__body" },
      categoria ? el("p", { class: "card__category", text: categoria }) : null,
      el("h2", { class: "card__name", text: p.nombre }),
      p.descripcion ? el("p", { class: "card__desc", text: p.descripcion }) : null,
      el("p", { class: "card__price", text: fmtPrecio(p.precio) }),
      el("button", {
        class: "btn btn--primary", type: "button",
        text: p.stock > 0 ? "Agregar al carrito" : "Sin stock", disabled: p.stock <= 0,
        onclick: () => agregar(p),
      })));
}

function pintarProductos(lista) {
  grid.replaceChildren(...lista.map(crearTarjeta));
  statusEl.textContent = lista.length
    ? `${lista.length} producto${lista.length === 1 ? "" : "s"} disponible${lista.length === 1 ? "" : "s"}`
    : "No hay productos en esta categoría.";
}

function crearFiltroCategorias(categorias) {
  if (!categorias.length) return;
  const select = el("select", {
    id: "categoryFilter", class: "category-filter", "aria-label": "Filtrar por categoría",
    onchange: () => {
      const id = Number(select.value);
      pintarProductos(id ? productos.filter((p) => p.categoriaId === id) : productos);
    },
  }, el("option", { value: "", text: "Todas las categorías" }),
    categorias.map((c) => el("option", { value: c.categoriaId, text: c.nombre })));
  statusEl.before(select);
}

async function cargarCatalogo() {
  try {
    const [prods, cats] = await Promise.all([
      apiFetch("/api/Productos"),
      apiFetch("/api/Categorias").catch(() => []),
    ]);
    productos = prods;
    categoriasPorId = new Map(cats.map((c) => [c.categoriaId, c.nombre]));
    if (!productos.length) { statusEl.textContent = "Aún no hay productos en el catálogo."; return; }
    crearFiltroCategorias(cats);
    pintarProductos(productos);
  } catch (e) {
    console.error(e);
    statusEl.textContent = e.message || "No pudimos cargar los productos.";
  }
}

actualizarBoton();
cargarCatalogo();
