montarNav();
if (exigirRol(["Administrador", "Vendedor"])) {
  const admin = Sesion.esAdmin();
  const yo = Sesion.id();
  let categorias = new Map();

  crearCrud({
    root: document.getElementById("contenido"),
    titulo: admin ? "Productos" : "Mis productos", singular: "producto", textoNuevo: "Nuevo producto",
    endpoint: "/api/Productos", id: "productoId",
    preparar: async () => {
      categorias = new Map((await apiFetch("/api/Categorias")).map((c) => [c.categoriaId, c.nombre]));
    },
    // El vendedor solo ve y edita sus productos (la API no lo restringe, se filtra aquí)
    filtro: (filas) => (admin ? filas : filas.filter((p) => p.vendedorId === yo)),
    buscar: (p) => `${p.nombre} ${p.descripcion ?? ""} ${categorias.get(p.categoriaId) ?? ""}`,
    columnas: [
      { k: "imagenUrl", t: "", f: (v) => v ? el("img", { class: "thumb", src: v, alt: "", loading: "lazy", onerror: (e) => e.target.remove() }) : "" },
      { k: "nombre", t: "Nombre" },
      { k: "categoriaId", t: "Categoría", f: (v) => categorias.get(v) ?? `#${v}` },
      { k: "precio", t: "Precio", f: fmtPrecio },
      { k: "stock", t: "Stock" },
      { k: "fechaCreacion", t: "Creado", f: fmtFecha },
    ],
    campos: [
      { k: "nombre", t: "Nombre", req: true, max: 150 },
      { k: "categoriaId", t: "Categoría", tipo: "select", numero: true, req: true,
        opciones: async () => (await apiFetch("/api/Categorias")).map((c) => ({ v: c.categoriaId, t: c.nombre })) },
      { k: "descripcion", t: "Descripción", tipo: "textarea", max: 1000 },
      { k: "precio", t: "Precio (CLP)", tipo: "number", req: true, min: 0, step: "1" },
      { k: "stock", t: "Stock", tipo: "number", req: true, min: 0, step: "1" },
      { k: "imagenUrl", t: "URL de la imagen", max: 500 },
    ],
    antesGuardar: (p, esNuevo) => {
      if (esNuevo) { p.vendedorId = yo; p.fechaCreacion = new Date().toISOString(); }
      else p.fechaActualizacion = new Date().toISOString();
      return p;
    },
    puedeCrear: true, puedeEditar: true, puedeBorrar: true,
  });
}
