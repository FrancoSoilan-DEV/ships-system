/**
 * portal.js — lógica compartida para todos los portales
 */

// ── Auth ───────────────────────────────────────────────────────
function getToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  return token;
}

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

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById(`section-${sectionId}`);
      if (target) target.classList.add('active');
    });
  });
}

// ── Sidebar toggle ─────────────────────────────────────────────
function initSidebarToggle() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
}

// ── Logout ─────────────────────────────────────────────────────
function initLogout() {
  const btn = document.getElementById('btn-logout');
  if (!btn) return;
  btn.addEventListener('click', logout);
}

// ── Cargar usuario ─────────────────────────────────────────────
async function loadUserName() {
  const res = await apiRequest('/api/users/me');
  if (!res) return null;
  const user = await res.json();
  const nameEl = document.getElementById('user-name');
  if (nameEl) nameEl.textContent = user.name;
  return user;
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) return;

  initNavigation();
  initSidebarToggle();
  initLogout();
  applyTranslations();

  // Manejar el botón de idioma — reemplaza el listener de i18n.js
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    // Clonar el botón para eliminar listeners previos de i18n.js
    const newBtn = langToggle.cloneNode(true);
    langToggle.parentNode.replaceChild(newBtn, langToggle);
    newBtn.addEventListener('click', () => {
      toggleLang();
    });
  }
});