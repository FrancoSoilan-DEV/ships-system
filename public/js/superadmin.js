/**
 * superadmin.js — lógica extra del portal SUPERADMIN
 * Extiende admin.js con funcionalidades adicionales
 */

// ── Inicialización ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('accessToken');
  if (!token) { window.location.href = '/login.html'; return; }

  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'SUPERADMIN') {
    window.location.href = '/login.html';
    return;
  }

  loadCaptains();
  loadAllUsers();
});

// ── Capitanes ──────────────────────────────────────────────────
async function loadCaptains() {
  const res = await apiRequest('/api/users/captains');
  const tbody = document.getElementById('captains-body');
  if (!tbody) return;

  if (!res || !res.ok) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  const captains = await res.json();
  if (!captains.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  tbody.innerHTML = captains.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td><code>${c.captain?.licenseNumber ?? '—'}</code></td>
      <td>${c.captain?.ship?.name ?? '—'}</td>
      <td>${new Date(c.createdAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge ${c.isActive ? 'badge-completed' : 'badge-cancelled'}">${c.isActive ? t('superadmin.active') : t('superadmin.inactive')}</span></td>
    </tr>
  `).join('');
}

// ── Todos los usuarios ─────────────────────────────────────────
async function loadAllUsers() {
  const res = await apiRequest('/api/users');
  const tbody = document.getElementById('users-body');
  if (!tbody) return;

  if (!res || !res.ok) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  const users = await res.json();
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><strong>${u.name}</strong></td>
      <td>${u.email}</td>
      <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge ${u.isActive ? 'badge-completed' : 'badge-cancelled'}">${u.isActive ? t('superadmin.active') : t('superadmin.inactive')}</span></td>
      <td>
        <button class="btn-edit" onclick="toggleUser('${u.id}', ${u.isActive})">
          ${u.isActive ? t('superadmin.btn.deactivate') : t('superadmin.btn.activate')}
        </button>
      </td>
    </tr>
  `).join('');
}

async function toggleUser(id, currentActive) {
  const res = await apiRequest(`/api/users/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: !currentActive }),
  });

  if (res && res.ok) {
    loadAllUsers();
  }
}

// ── Override goToSection para superadmin ───────────────────────
function goToSuperSection(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });
  document.querySelectorAll('.portal-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add('active');
}