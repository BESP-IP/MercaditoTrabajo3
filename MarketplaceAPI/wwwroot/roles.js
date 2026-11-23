montarNav();
if (exigirRol(["Administrador"])) {
  crearCrud({
    root: document.getElementById("contenido"),
    titulo: "Roles", singular: "rol", textoNuevo: "Nuevo rol",
    nota: "Cuidado: la API autoriza por nombre (Administrador, Vendedor, Comprador). Si renombras o eliminas esos roles, los permisos dejarán de funcionar.",
    endpoint: "/api/Roles", id: "rolId",
    columnas: [
      { k: "rolId", t: "ID" },
      { k: "nombre", t: "Nombre" },
      { k: "descripcion", t: "Descripción" },
    ],
    campos: [
      { k: "nombre", t: "Nombre", req: true, max: 50 },
      { k: "descripcion", t: "Descripción", tipo: "textarea", max: 250 },
    ],
    puedeCrear: true, puedeEditar: true, puedeBorrar: true,
  });
}
