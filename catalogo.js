/**
 * catalogo.js
 * ---------------------------------------------------------
 * Lee la colección "catalogo" de Firestore y la muestra en la
 * página de servicios, con filtro por categoría.
 * Cada documento tiene: { nombre, descripcion, categoria, icono }
 */

const listaEl = document.getElementById("catalogo-lista");
const filtrosEl = document.getElementById("filtros");

// Guardamos los servicios en memoria para filtrar sin volver a leer Firestore.
let itemsCatalogo = [];

function renderizar(categoria) {
  const items =
    categoria === "todos"
      ? itemsCatalogo
      : itemsCatalogo.filter((item) => item.categoria === categoria);

  if (!items.length) {
    listaEl.innerHTML = '<div class="estado-vacio">No hay servicios en esta categoría todavía.</div>';
    return;
  }

  listaEl.innerHTML = items.map(crearTarjetaServicio).join("");
}

// Crea un botón de filtro por cada categoría que exista en los datos.
function construirFiltros() {
  const categorias = [...new Set(itemsCatalogo.map((i) => i.categoria).filter(Boolean))];
  categorias.forEach((categoria) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.type = "button";
    chip.textContent = categoria;
    chip.dataset.categoria = categoria;
    filtrosEl.appendChild(chip);
  });
}

filtrosEl.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".chip");
  if (!boton) return;
  filtrosEl.querySelectorAll(".chip").forEach((c) => c.classList.remove("activo"));
  boton.classList.add("activo");
  renderizar(boton.dataset.categoria);
});

db.collection("catalogo")
  .orderBy("nombre")
  .get()
  .then((snapshot) => {
    itemsCatalogo = snapshot.docs.map((doc) => doc.data());
    if (!itemsCatalogo.length) {
      listaEl.innerHTML = '<div class="estado-vacio">Pronto publicaremos nuestros servicios aquí.</div>';
      return;
    }
    construirFiltros();
    renderizar("todos");
  })
  .catch((error) => {
    console.error("Error al cargar el catálogo:", error);
    listaEl.innerHTML =
      '<div class="estado-vacio">No pudimos cargar los servicios en este momento. Intenta recargar la página.</div>';
  });
