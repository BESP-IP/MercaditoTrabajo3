montarNav();
if (exigirRol(["Administrador"])) {
  crearCrud({
    root: document.getElementById("contenido"),
    titulo: "Categorías", singular: "categoría", textoNuevo: "Nueva categoría",
    endpoint: "/api/Categorias", id: "categoriaId",
    columnas: [
      { k: "categoriaId", t: "ID" },
      { k: "nombre", t: "Nombre" },
      { k: "descripcion", t: "Descripción" },
    ],
    campos: [
      { k: "nombre", t: "Nombre", req: true, max: 100 },
      { k: "descripcion", t: "Descripción", tipo: "textarea", max: 250 },
    ],
    puedeCrear: true, puedeEditar: true, puedeBorrar: true,
  });
}
