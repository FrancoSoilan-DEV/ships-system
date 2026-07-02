/**
 * auth.js — lógica del login y registro
 * 
 * Flujo:
 * 1. Usuario llena el form y hace click en el botón
 * 2. Llamamos a la API con fetch()
 * 3. Si la respuesta es OK guardamos los tokens en localStorage
 * 4. Redirigimos al portal según el rol del usuario
 * 5. Si hay error lo mostramos en pantalla
 */

// ── Elementos del DOM ──────────────────────────────────────────
const tabLogin       = document.getElementById('tab-login');
const tabRegister    = document.getElementById('tab-register');
const formLogin      = document.getElementById('form-login');
const formRegister   = document.getElementById('form-register');

const loginEmail     = document.getElementById('login-email');
const loginPassword  = document.getElementById('login-password');
const loginError     = document.getElementById('login-error');
const btnLogin       = document.getElementById('btn-login');

const registerName     = document.getElementById('register-name');
const registerEmail    = document.getElementById('register-email');
const registerPassword = document.getElementById('register-password');
const registerError    = document.getElementById('register-error');
const btnRegister      = document.getElementById('btn-register');

// ── Tabs ───────────────────────────────────────────────────────
tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabRegister.classList.remove('active');
  formLogin.classList.remove('hidden');
  formRegister.classList.add('hidden');
  hideError(loginError);
});

tabRegister.addEventListener('click', () => {
  tabRegister.classList.add('active');
  tabLogin.classList.remove('active');
  formRegister.classList.remove('hidden');
  formLogin.classList.add('hidden');
  hideError(registerError);
});

// ── Login ──────────────────────────────────────────────────────
btnLogin.addEventListener('click', async () => {
  const email    = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  // Validación básica en el frontend
  if (!email || !password) {
    showError(loginError, 'Completá todos los campos');
    return;
  }

  setLoading(btnLogin, true);
  hideError(loginError);

  try {
    // Llamada a la API
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // La API retornó un error (401, 400, etc.)
      showError(loginError, data.message || 'Credenciales inválidas');
      return;
    }

    // Guardamos los tokens en localStorage
    saveTokens(data.accessToken, data.refreshToken);

    // Redirigimos según el rol del usuario
    redirectByRole(data.accessToken);

  } catch {
    showError(loginError, 'Error de conexión. Intentá de nuevo.');
  } finally {
    setLoading(btnLogin, false);
  }
});

// ── Register ───────────────────────────────────────────────────
btnRegister.addEventListener('click', async () => {
  const name     = registerName.value.trim();
  const email    = registerEmail.value.trim();
  const password = registerPassword.value.trim();

  if (!name || !email || !password) {
    showError(registerError, 'Completá todos los campos');
    return;
  }

  if (password.length < 6) {
    showError(registerError, 'La contraseña debe tener al menos 6 caracteres');
    return;
  }

  setLoading(btnRegister, true);
  hideError(registerError);

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(registerError, data.message || 'Error al crear la cuenta');
      return;
    }

    saveTokens(data.accessToken, data.refreshToken);
    redirectByRole(data.accessToken);

  } catch {
    showError(registerError, 'Error de conexión. Intentá de nuevo.');
  } finally {
    setLoading(btnRegister, false);
  }
});

// ── Helpers ────────────────────────────────────────────────────

/**
 * Guarda los tokens en localStorage.
 * El accessToken se manda en cada request a la API.
 * El refreshToken se usa para renovar el accessToken cuando expira.
 */
function saveTokens(accessToken, refreshToken) {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

/**
 * Decodifica el payload del JWT (sin verificar la firma)
 * para leer el rol del usuario y redirigirlo al portal correcto.
 * 
 * El JWT tiene 3 partes separadas por puntos: header.payload.signature
 * El payload está en base64 y contiene { sub, email, role, exp, iat }
 */
function redirectByRole(accessToken) {
  const payload = JSON.parse(atob(accessToken.split('.')[1]));
  const role = payload.role;

  // Redirigir según el rol
  switch (role) {
    case 'SUPERADMIN': window.location.href = '/portal/superadmin.html'; break;
    case 'ADMIN':      window.location.href = '/portal/admin.html';      break;
    case 'CAPTAIN':    window.location.href = '/portal/captain.html';    break;
    case 'CLIENT':     window.location.href = '/portal/client.html';     break;
    default:           window.location.href = '/';
  }
}

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(el) {
  el.classList.add('hidden');
}

function setLoading(btn, loading) {
  btn.disabled = loading;
  btn.textContent = loading ? '...' : btn.getAttribute('data-i18n-original') || btn.textContent;
}

// ── Si ya está logueado, redirigir ────────────────────────────
const existingToken = localStorage.getItem('accessToken');
if (existingToken) {
  try {
    redirectByRole(existingToken);
  } catch {
    // Token inválido, lo borramos
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}