montarNav();
if (exigirRol()) {
  const admin = Sesion.esAdmin();
  const yo = Sesion.id();
  let productos = new Map();
  let usuarios = new Map();

  async function verDetalle(compra) {
    try {
      const items = (await apiFetch("/api/DetallesCompra")).filter((d) => d.compraId === compra.compraId);
      const cuerpo = items.length
        ? el("div", { class: "table-wrap" }, el("table", { class: "table" },
            el("thead", {}, el("tr", {}, ["Producto", "Cant.", "Precio unit.", "Subtotal"].map((t) => el("th", { text: t })))),
            el("tbody", {}, items.map((d) => el("tr", {},
              el("td", { text: productos.get(d.productoId) ?? `Producto #${d.productoId}` }),
              el("td", { text: d.cantidad }),
              el("td", { text: fmtPrecio(d.precioUnitario) }),
              el("td", { text: fmtPrecio(d.subtotal) })))),
            el("tfoot", {}, el("tr", {}, el("th", { colSpan: 3, text: "Total" }), el("th", { text: fmtPrecio(compra.total) })))))
        : el("p", { class: "empty", text: "Esta compra no tiene detalles registrados." });
      modal(`Compra #${compra.compraId}`, cuerpo);
    } catch (e) { aviso(e.message, true); }
  }

  crearCrud({
    root: document.getElementById("contenido"),
    titulo: admin ? "Compras" : "Mis compras", singular: "compra", textoNuevo: "",
    endpoint: "/api/Compras", id: "compraId", descendente: true,
    preparar: async () => {
      productos = new Map((await apiFetch("/api/Productos")).map((p) => [p.productoId, p.nombre]));
      if (admin) usuarios = new Map((await apiFetch("/api/Usuarios")).map((u) => [u.usuarioId, `${u.nombre} ${u.apellido}`]));
    },
    // La API devuelve todas las compras: el comprador solo ve las suyas
    filtro: (filas) => (admin ? filas : filas.filter((c) => c.compradorId === yo)),
    buscar: (c) => `${c.compraId} ${usuarios.get(c.compradorId) ?? ""} ${c.metodoPago} ${c.estadoPago} ${c.estadoCompra}`,
    columnas: [
      { k: "compraId", t: "N°", f: (v) => `#${v}` },
      { k: "fechaCompra", t: "Fecha", f: fmtFecha },
      ...(admin ? [{ k: "compradorId", t: "Comprador", f: (v) => usuarios.get(v) ?? `#${v}` }] : []),
      { k: "total", t: "Total", f: fmtPrecio },
      { k: "metodoPago", t: "Método" },
      { k: "estadoPago", t: "Pago", f: insignia },
      { k: "estadoCompra", t: "Estado", f: insignia },
    ],
    campos: [
      { k: "total", t: "Total", tipo: "number", soloLectura: true, f: fmtPrecio },
      { k: "estadoPago", t: "Estado del pago", tipo: "select", req: true, opciones: opcionesTexto(["Pendiente", "Pagado", "Rechazado"]) },
      { k: "estadoCompra", t: "Estado de la compra", tipo: "select", req: true, opciones: opcionesTexto(["Pendiente", "Completada", "Cancelada"]) },
    ],
    acciones: [{ t: "Ver detalle", fn: verDetalle }],
    // Una compra con detalles no se puede borrar directamente: se borran primero los detalles
    eliminar: async (c) => {
      const det = (await apiFetch("/api/DetallesCompra")).filter((d) => d.compraId === c.compraId);
      for (const d of det) await apiFetch(`/api/DetallesCompra/${d.detalleCompraId}`, { method: "DELETE" });
      await apiFetch(`/api/Compras/${c.compraId}`, { method: "DELETE" });
    },
    puedeCrear: false, puedeEditar: admin, puedeBorrar: admin,
  });
}
