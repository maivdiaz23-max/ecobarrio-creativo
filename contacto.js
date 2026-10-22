/**
 * contacto.js
 * ---------------------------------------------------------
 * Envía el formulario de contacto a la colección "mensajes" de
 * Firestore. Cada mensaje queda visible en el panel de admin.
 */

const formulario = document.getElementById("form-contacto");
const botonEnviar = document.getElementById("btn-enviar");
const estadoFormulario = document.getElementById("estado-formulario");

function mostrarEstado(texto, tipo) {
  estadoFormulario.textContent = texto;
  estadoFormulario.className = `mensaje-estado visible ${tipo}`;
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (!formulario.checkValidity()) {
    mostrarEstado("Revisa los campos: nombre, correo y mensaje son obligatorios.", "error");
    return;
  }

  const datos = {
    nombre: document.getElementById("nombre").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    barrio: document.getElementById("barrio").value.trim(),
    mensaje: document.getElementById("mensaje").value.trim(),
    leido: false,
    fecha: firebase.firestore.FieldValue.serverTimestamp(),
  };

  botonEnviar.disabled = true;
  botonEnviar.textContent = "Enviando...";

  try {
    await db.collection("mensajes").add(datos);
    formulario.reset();
    mostrarEstado("¡Gracias! Recibimos tu mensaje y te contactaremos pronto.", "exito");
  } catch (error) {
    console.error("Error al enviar el mensaje:", error);
    mostrarEstado("No pudimos enviar tu mensaje. Intenta de nuevo en unos minutos.", "error");
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = "Enviar mensaje";
  }
});
