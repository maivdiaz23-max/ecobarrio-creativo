/**
 * chatbot.js
 * ---------------------------------------------------------
 * Chatbot flotante que responde como EcoBarrio Creativo.
 * Llama a la API de Google Gemini directamente desde el navegador
 * (así no necesitamos un servidor propio y funciona en GitHub Pages).
 *
 * El bot "conoce" el negocio de dos maneras:
 *  1) CONTEXTO_NEGOCIO: texto fijo con quiénes somos y el tono de marca.
 *  2) Los servicios del catálogo, que se leen de Firestore, así el bot
 *     siempre habla de lo mismo que se ve en la página.
 *
 * CONFIGURACIÓN (README.md, sección 3):
 *  - Crea una API key gratis en https://aistudio.google.com/app/apikey
 *  - Restríngela al dominio de tu GitHub Pages en Google Cloud Console.
 *  - Pégala abajo en GEMINI_API_KEY.
 */
const GEMINI_API_KEY = "TU_API_KEY_DE_GEMINI";

// "gemini-flash-latest" siempre apunta al modelo Flash vigente,
// así el chatbot no deja de funcionar cuando Google retira modelos viejos.
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const CONTEXTO_NEGOCIO = `
Eres el asistente virtual de "EcoBarrio Creativo", un emprendimiento comunitario
que hace limpieza de barrios, reciclaje creativo y educación ambiental,
liderado por jóvenes y vecinos del programa Jóvenes Creativos.

Tono: cercano, motivador y sencillo, como un vecino que invita a participar.
Responde siempre en español y en máximo 4 líneas.

Lo que hacemos:
- Jornadas de limpieza comunitaria con vecinos y voluntarios.
- Talleres de reciclaje creativo (materas, decoración y objetos útiles con residuos).
- Canecas decoradas con mensajes ecológicos para separar residuos.
- Charlas de educación ambiental para colegios y juntas de acción comunal.

Reglas:
- Solo habla de EcoBarrio Creativo, sus servicios y cómo participar.
- Si preguntan algo fuera del negocio, responde con amabilidad que solo puedes
  ayudar con temas de EcoBarrio Creativo.
- No inventes precios, fechas ni datos que no tengas. Para eso, invita a usar
  el formulario de la página de Contacto.
- Si te piden ayuda para escribir un mensaje (por ejemplo para invitar a los
  vecinos a una jornada), redáctalo listo para copiar y pegar, con el tono de la marca.
`;

document.addEventListener("DOMContentLoaded", () => {
  const boton = document.getElementById("chat-boton");
  const panel = document.getElementById("chat-panel");
  const cerrar = document.getElementById("chat-cerrar");
  const form = document.getElementById("chat-form");
  const input = document.getElementById("chat-input");
  const mensajes = document.getElementById("chat-mensajes");

  if (!boton || !panel) return; // esta página no tiene chat

  // Historial en memoria: se reinicia al recargar la página.
  const historial = [];

  // Servicios del catálogo en texto, se cargan una sola vez.
  let textoCatalogo = null;

  boton.addEventListener("click", () => {
    const abierto = panel.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    if (abierto) input.focus();
  });

  cerrar.addEventListener("click", () => {
    panel.classList.remove("abierto");
    boton.setAttribute("aria-expanded", "false");
    boton.focus();
  });

  // Cerrar con la tecla Escape (mejora la accesibilidad con teclado).
  panel.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") cerrar.click();
  });

  function agregarBurbuja(texto, tipo) {
    const burbuja = document.createElement("div");
    burbuja.className = `chat-burbuja ${tipo}`;
    burbuja.textContent = texto; // textContent evita inyectar HTML
    mensajes.appendChild(burbuja);
    mensajes.scrollTop = mensajes.scrollHeight;
    return burbuja;
  }

  // Lee el catálogo de Firestore y lo convierte en una lista de texto para la IA.
  async function obtenerCatalogo() {
    if (textoCatalogo !== null) return textoCatalogo;
    try {
      const snapshot = await db.collection("catalogo").get();
      textoCatalogo = snapshot.docs
        .map((doc) => {
          const s = doc.data();
          return `- ${s.nombre} (${s.categoria || "General"}): ${s.descripcion}`;
        })
        .join("\n");
    } catch (error) {
      console.error("El chatbot no pudo leer el catálogo:", error);
      textoCatalogo = ""; // el bot igual funciona con el contexto fijo
    }
    return textoCatalogo;
  }

  async function pedirRespuestaIA() {
    const catalogo = await obtenerCatalogo();
    const instrucciones = catalogo
      ? `${CONTEXTO_NEGOCIO}\nServicios actuales del catálogo:\n${catalogo}`
      : CONTEXTO_NEGOCIO;

    const respuesta = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: instrucciones }] },
        contents: historial,
      }),
    });

    if (!respuesta.ok) {
      throw new Error(`La API respondió con estado ${respuesta.status}`);
    }

    const datos = await respuesta.json();
    const texto = datos?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!texto) throw new Error("Respuesta vacía de la API");
    return texto.trim();
  }

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const pregunta = input.value.trim();
    if (!pregunta) return;

    agregarBurbuja(pregunta, "usuario");
    historial.push({ role: "user", parts: [{ text: pregunta }] });
    input.value = "";
    input.disabled = true;

    // Si todavía no se pegó la clave, avisamos claro en vez de fallar en silencio.
    if (GEMINI_API_KEY.startsWith("TU_")) {
      agregarBurbuja("El asistente todavía no está configurado. Escríbenos desde la página de Contacto.", "bot");
      historial.pop();
      input.disabled = false;
      return;
    }

    const burbujaCarga = agregarBurbuja("Escribiendo...", "bot cargando");

    try {
      const respuesta = await pedirRespuestaIA();
      burbujaCarga.remove();
      agregarBurbuja(respuesta, "bot");
      historial.push({ role: "model", parts: [{ text: respuesta }] });
    } catch (error) {
      console.error("Error del chatbot:", error);
      burbujaCarga.remove();
      historial.pop(); // quitamos la pregunta sin respuesta para no dañar el historial
      agregarBurbuja("Ups, no pude responder ahora. Intenta de nuevo en un momento o escríbenos desde Contacto.", "bot");
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
});
