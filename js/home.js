/**
 * home.js
 * ---------------------------------------------------------
 * Muestra hasta 3 servicios del catálogo en la página de inicio.
 */

const contenedorPreview = document.getElementById("catalogo-preview");

db.collection("catalogo")
  .limit(3)
  .get()
  .then((snapshot) => {
    if (snapshot.empty) {
      contenedorPreview.innerHTML =
        '<div class="estado-vacio">Pronto publicaremos nuestros servicios aquí.</div>';
      return;
    }
    contenedorPreview.innerHTML = snapshot.docs
      .map((doc) => crearTarjetaServicio(doc.data()))
      .join("");
  })
  .catch((error) => {
    console.error("Error al cargar el catálogo:", error);
    contenedorPreview.innerHTML =
      '<div class="estado-vacio">No pudimos cargar los servicios en este momento. Intenta recargar la página.</div>';
  });
