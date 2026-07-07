/**
 * portal.js — lógica compartida para todos los portales
 * 
 * Maneja:
 * - Verificación de autenticación
 * - Navegación entre secciones
 * - Carga del perfil del usuario
 * - Logout
 */

// ── Auth ───────────────────────────────────────────────────────

/**
 * Obtiene el accessToken del localStorage.
 * Si no existe, redirige al login.
 */
function getToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  return token;
}

/**
 * Decodifica el payload del JWT sin verificar la firma.
 * Solo para leer el rol y nombre del usuario en el frontend.
 */
function getPayload() {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    logout();
    return null;
  }
}

/**
 * Hace una request a la API con el token en el header.
 */
async function apiRequest(url, options = {}) {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  // Si el token expiró, hacer refresh o redirigir al login
  if (res.status === 401) {
    logout();
    return null;
  }

  return res;
}

function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/login.html';
}

// ── Navegación ─────────────────────────────────────────────────

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.portal-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = item.getAttribute('data-section');

      // Actualizar nav items
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Mostrar sección correspondiente
      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById(`section-${sectionId}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── Sidebar toggle (mobile) ────────────────────────────────────

function initSidebarToggle() {
  const toggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}

// ── Logout ─────────────────────────────────────────────────────

function initLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', logout);
}

// ── Cargar nombre del usuario en topbar ────────────────────────

async function loadUserName() {
  const res = await apiRequest('/api/users/me');
  if (!res) return;

  const user = await res.json();
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name;

  return user;
}

// ── Inicializar todo ───────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Verificar que hay token
  if (!getToken()) return;

  initNavigation();
  initSidebarToggle();
  initLogout();
  applyTranslations();

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) langToggle.addEventListener('click', toggleLang);
});