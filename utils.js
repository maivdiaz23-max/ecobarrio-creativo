/**
 * utils.js
 * ---------------------------------------------------------
 * Funciones pequeñas que usan varias páginas.
 */

// Convierte texto en texto "seguro" para poner dentro de HTML.
// Es necesario porque los mensajes de contacto los escribe cualquier
// persona: sin esto, alguien podría meter código en el formulario y
// ejecutarlo en el panel del administrador.
function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}

// Dibuja una tarjeta de servicio del catálogo (se usa en el inicio y en el catálogo).
function crearTarjetaServicio(item) {
  return `
    <article class="item-catalogo">
      <div class="item-imagen" aria-hidden="true">${escaparHTML(item.icono || "🌱")}</div>
      <div class="item-cuerpo">
        <span class="item-categoria">${escaparHTML(item.categoria || "General")}</span>
        <h3>${escaparHTML(item.nombre)}</h3>
        <p>${escaparHTML(item.descripcion)}</p>
      </div>
    </article>`;
}
