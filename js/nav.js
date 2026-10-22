/**
 * nav.js
 * ---------------------------------------------------------
 * Comportamiento compartido por todas las páginas:
 *  1) Abrir/cerrar el menú en móvil.
 *  2) Revelar secciones con una animación sutil al hacer scroll
 *     (respeta prefers-reduced-motion, ver style.css).
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Menú móvil ---
  const boton = document.querySelector(".nav-toggle");
  const lista = document.querySelector(".nav-lista");
  if (boton && lista) {
    boton.addEventListener("click", () => {
      const abierto = lista.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  // --- Animación de aparición (IntersectionObserver, sin librerías) ---
  const elementos = document.querySelectorAll(".animar-entrada");
  if ("IntersectionObserver" in window && elementos.length) {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add("visible");
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    elementos.forEach((el) => observador.observe(el));
  } else {
    elementos.forEach((el) => el.classList.add("visible"));
  }
});
