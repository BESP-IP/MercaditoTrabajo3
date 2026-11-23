montarNav();
if (exigirRol()) {
  const admin = Sesion.esAdmin();
  const yo = Sesion.id();
  let compras = new Map();
  let productos = new Map();

  crearCrud({
    root: document.getElementById("contenido"),
    titulo: "Detalle de compras", singular: "detalle", textoNuevo: "Nuevo detalle",
    nota: admin ? "Al crear, editar o eliminar un detalle no se recalcula el total de la compra." : null,
    endpoint: "/api/DetallesCompra", id: "detalleCompraId",
    preparar: async () => {
      compras = new Map((await apiFetch("/api/Compras")).map((c) => [c.compraId, c]));
      productos = new Map((await apiFetch("/api/Productos")).map((p) => [p.productoId, p.nombre]));
    },
    filtro: (filas) => (admin ? filas : filas.filter((d) => compras.get(d.compraId)?.compradorId === yo)),
    buscar: (d) => `${d.compraId} ${productos.get(d.productoId) ?? ""}`,
    columnas: [
      { k: "detalleCompraId", t: "ID" },
      { k: "compraId", t: "Compra", f: (v) => `#${v}` },
      { k: "productoId", t: "Producto", f: (v) => productos.get(v) ?? `#${v}` },
      { k: "cantidad", t: "Cantidad" },
      { k: "precioUnitario", t: "Precio unit.", f: fmtPrecio },
      { k: "subtotal", t: "Subtotal", f: fmtPrecio },
    ],
    campos: [
      { k: "compraId", t: "Compra", tipo: "select", numero: true, req: true,
        opciones: () => [...compras.values()].sort((a, b) => b.compraId - a.compraId)
          .map((c) => ({ v: c.compraId, t: `Compra #${c.compraId} · ${fmtFecha(c.fechaCompra)}` })) },
      { k: "productoId", t: "Producto", tipo: "select", numero: true, req: true,
        opciones: () => [...productos].map(([v, t]) => ({ v, t })) },
      { k: "cantidad", t: "Cantidad", tipo: "number", req: true, min: 1, step: "1" },
      { k: "precioUnitario", t: "Precio unitario (CLP)", tipo: "number", req: true, min: 0, step: "1" },
    ],
    antesGuardar: (d) => { d.subtotal = d.cantidad * d.precioUnitario; return d; },
    puedeCrear: admin, puedeEditar: admin, puedeBorrar: admin,
  });
}
