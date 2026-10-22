/**
 * admin.js
 * ---------------------------------------------------------
 * Controla el panel privado:
 *  1) Login/logout con Firebase Auth (usuario y clave creados
 *     manualmente en la consola de Firebase — ver README.md).
 *  2) Pestañas Catálogo / Mensajes.
 *  3) CRUD del catálogo (crear, editar, borrar).
 *  4) Listado de mensajes de contacto, con marcar como leído.
 */

// --- Referencias del DOM ---
const vistaLogin = document.getElementById("vista-login");
const vistaPanel = document.getElementById("vista-panel");
const formLogin = document.getElementById("form-login");
const estadoLogin = document.getElementById("estado-login");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const textoSesion = document.getElementById("texto-sesion");

// Guardamos las funciones para dejar de escuchar Firestore al cerrar sesión.
let detenerCatalogo = null;
let detenerMensajes = null;

// --- Autenticación ---
formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const correo = document.getElementById("login-correo").value.trim();
  const clave = document.getElementById("login-clave").value;

  btnLogin.disabled = true;
  btnLogin.textContent = "Ingresando...";
  estadoLogin.className = "mensaje-estado";

  try {
    await auth.signInWithEmailAndPassword(correo, clave);
    // El listener onAuthStateChanged de abajo se encarga de mostrar el panel.
  } catch (error) {
    console.error("Error de login:", error);
    const sinRed = error.code === "auth/network-request-failed";
    estadoLogin.textContent = sinRed
      ? "No hay conexión. Revisa tu internet e intenta de nuevo."
      : "Correo o contraseña incorrectos.";
    estadoLogin.className = "mensaje-estado visible error";
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Ingresar";
  }
});

btnLogout.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged((usuario) => {
  if (usuario) {
    vistaLogin.style.display = "none";
    vistaPanel.style.display = "block";
    textoSesion.textContent = `Sesión iniciada como ${usuario.email}`;
    cargarCatalogo();
    cargarMensajes();
  } else {
    if (detenerCatalogo) detenerCatalogo();
    if (detenerMensajes) detenerMensajes();
    vistaLogin.style.display = "block";
    vistaPanel.style.display = "none";
  }
});

// --- Pestañas ---
document.querySelectorAll(".pestana").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".pestana").forEach((t) => t.classList.remove("activa"));
    tab.classList.add("activa");
    document.querySelectorAll(".pestana").forEach((t) => t.setAttribute("aria-selected", t === tab ? "true" : "false"));
    document.getElementById("tab-catalogo").style.display = tab.dataset.tab === "catalogo" ? "block" : "none";
    document.getElementById("tab-mensajes").style.display = tab.dataset.tab === "mensajes" ? "block" : "none";
  });
});

// --- CRUD de catálogo ---
const formItem = document.getElementById("form-item");
const tablaCatalogo = document.getElementById("tabla-catalogo");
const btnItem = document.getElementById("btn-item");
const estadoItem = document.getElementById("estado-item");

function mostrarEstadoItem(texto, tipo) {
  estadoItem.textContent = texto;
  estadoItem.className = `mensaje-estado visible ${tipo}`;
}

function cargarCatalogo() {
  if (detenerCatalogo) detenerCatalogo();
  detenerCatalogo = db.collection("catalogo").orderBy("nombre").onSnapshot(
    (snapshot) => {
      if (snapshot.empty) {
        tablaCatalogo.innerHTML = '<tr><td colspan="4">No hay servicios todavía. Agrega el primero arriba.</td></tr>';
        return;
      }
      tablaCatalogo.innerHTML = snapshot.docs
        .map((doc) => {
          const item = doc.data();
          return `
            <tr>
              <td>${escaparHTML(item.icono || "🌱")} ${escaparHTML(item.nombre)}</td>
              <td>${escaparHTML(item.categoria || "-")}</td>
              <td>${escaparHTML(item.descripcion)}</td>
              <td class="acciones-fila">
                <button class="icono-boton" data-editar="${doc.id}" aria-label="Editar ${escaparHTML(item.nombre)}">Editar</button>
                <button class="icono-boton" data-borrar="${doc.id}" aria-label="Borrar ${escaparHTML(item.nombre)}">Borrar</button>
              </td>
            </tr>`;
        })
        .join("");
    },
    (error) => {
      console.error("Error al leer catálogo:", error);
      tablaCatalogo.innerHTML = '<tr><td colspan="4">Error al cargar. Revisa la consola.</td></tr>';
    }
  );
}

formItem.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const id = document.getElementById("item-id").value;
  const datos = {
    nombre: document.getElementById("item-nombre").value.trim(),
    categoria: document.getElementById("item-categoria").value.trim(),
    icono: document.getElementById("item-icono").value.trim(),
    descripcion: document.getElementById("item-descripcion").value.trim(),
  };

  btnItem.disabled = true;
  try {
    if (id) {
      await db.collection("catalogo").doc(id).update(datos);
    } else {
      await db.collection("catalogo").add(datos);
    }
    mostrarEstadoItem(id ? "Servicio actualizado." : "Servicio guardado.", "exito");
    formItem.reset();
    document.getElementById("item-id").value = "";
    document.getElementById("btn-item").textContent = "Guardar servicio";
  } catch (error) {
    console.error("Error al guardar el servicio:", error);
    mostrarEstadoItem("No se pudo guardar el servicio. Intenta de nuevo.", "error");
  } finally {
    btnItem.disabled = false;
  }
});

tablaCatalogo.addEventListener("click", async (evento) => {
  const idEditar = evento.target.dataset.editar;
  const idBorrar = evento.target.dataset.borrar;

  if (idEditar) {
    const doc = await db.collection("catalogo").doc(idEditar).get();
    const item = doc.data();
    document.getElementById("item-id").value = idEditar;
    document.getElementById("item-nombre").value = item.nombre;
    document.getElementById("item-categoria").value = item.categoria || "";
    document.getElementById("item-icono").value = item.icono || "";
    document.getElementById("item-descripcion").value = item.descripcion;
    document.getElementById("btn-item").textContent = "Actualizar servicio";
    formItem.scrollIntoView({ behavior: "smooth" });
  }

  if (idBorrar) {
    if (confirm("¿Borrar este servicio del catálogo?")) {
      try {
        await db.collection("catalogo").doc(idBorrar).delete();
        mostrarEstadoItem("Servicio borrado.", "exito");
      } catch (error) {
        console.error("Error al borrar:", error);
        mostrarEstadoItem("No se pudo borrar el servicio.", "error");
      }
    }
  }
});

// --- Mensajes de contacto ---
const tablaMensajes = document.getElementById("tabla-mensajes");

function cargarMensajes() {
  if (detenerMensajes) detenerMensajes();
  detenerMensajes = db.collection("mensajes").orderBy("fecha", "desc").onSnapshot(
    (snapshot) => {
      if (snapshot.empty) {
        tablaMensajes.innerHTML = '<tr><td colspan="6">Todavía no han llegado mensajes.</td></tr>';
        return;
      }
      tablaMensajes.innerHTML = snapshot.docs
        .map((doc) => {
          const m = doc.data();
          const fecha = m.fecha ? m.fecha.toDate().toLocaleString("es-CO") : "—";
          return `
            <tr class="${m.leido ? "" : "no-leido"}">
              <td>${fecha}</td>
              <td>${escaparHTML(m.nombre)}${!m.leido ? '<span class="badge-nuevo">Nuevo</span>' : ""}</td>
              <td>${escaparHTML(m.correo)}</td>
              <td>${escaparHTML(m.barrio || "-")}</td>
              <td>${escaparHTML(m.mensaje)}</td>
              <td class="acciones-fila">
                ${!m.leido ? `<button class="icono-boton" data-leido="${doc.id}">Marcar leído</button>` : ""}
              </td>
            </tr>`;
        })
        .join("");
    },
    (error) => {
      console.error("Error al leer mensajes:", error);
      tablaMensajes.innerHTML = '<tr><td colspan="6">Error al cargar. Revisa la consola.</td></tr>';
    }
  );
}

tablaMensajes.addEventListener("click", async (evento) => {
  const idLeido = evento.target.dataset.leido;
  if (idLeido) {
    try {
      await db.collection("mensajes").doc(idLeido).update({ leido: true });
    } catch (error) {
      console.error("Error al marcar como leído:", error);
    }
  }
});
