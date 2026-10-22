/**
 * firebase-config.js
 * ---------------------------------------------------------
 * Conexión a Firebase (Firestore para los datos y Auth para el login).
 *
 * IMPORTANTE: reemplaza estos valores con los de TU proyecto de
 * Firebase (pasos en README.md, sección 1). Estos valores no son
 * secretos como una contraseña: solo identifican tu proyecto. La
 * seguridad real la dan las reglas de Firestore (archivo firestore.rules).
 */
const firebaseConfig = {
  apiKey: "AIzaSyBKfFRFsIjnndwXhG4fyYQvx0QbHBgSj3g",
  authDomain: "ecobarrio-682b9.firebaseapp.com",
  projectId: "ecobarrio-682b9",
  storageBucket: "ecobarrio-682b9.firebasestorage.app",
  messagingSenderId: "759853331027",
  appId: "1:759853331027:web:e4c8716242fd55f7914ca6",
};

// Inicializa Firebase una sola vez y deja "db" y "auth" disponibles
// para los demás scripts.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Solo la página del administrador carga el script de Auth. En las demás
// páginas "auth" queda en null (así evitamos un error que dejaría "db" sin definir).
const auth = typeof firebase.auth === "function" ? firebase.auth() : null;

