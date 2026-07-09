/**
 * admin.js — lógica del portal ADMIN
 */

const SHIP_TYPE_LABELS = {
  CONTAINER:    '📦 Contenedor',
  BULK_CARRIER: '⚓ Granelero',
  TANKER:       '🛢️ Tanquero',
  REEFER:       '❄️ Frigorífico',
  HEAVY_LIFT:   '🏗️ Carga pesada',
};

let allVoyages = [];

// ── Inicialización ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await loadUserName();
  if (!user) return;

  // Verificar que es admin
  const token = localStorage.getItem('accessToken');
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'ADMIN' && payload.role !== 'SUPERADMIN') {
    window.location.href = '/login.html';
    return;
  }

  loadDashboard();
  loadShips();
  loadVoyages();
  loadClients();
  loadEscalations();
  initAdminFilters();
});

// ── Dashboard ──────────────────────────────────────────────────
async function loadDashboard() {
  const [shipsStats, voyagesStats, usersStats] = await Promise.all([
    apiRequest('/api/ships/stats').then(r => r?.json()),
    apiRequest('/api/voyages/stats').then(r => r?.json()),
    apiRequest('/api/users/stats').then(r => r?.json()),
  ]);

  if (shipsStats) {
    setEl('stat-ships-total', shipsStats.total);
    setEl('stat-ships-available', shipsStats.available);
  }

  if (voyagesStats) {
    setEl('stat-voyages-total', voyagesStats.total);
    setEl('stat-revenue', '$' + (voyagesStats.totalRevenue ?? 0).toLocaleString());
  }

  if (usersStats) {
    setEl('stat-clients-total', usersStats.clients);
  }

  // Últimos viajes
  const voyagesRes = await apiRequest('/api/voyages');
  if (voyagesRes && voyagesRes.ok) {
    const voyages = await voyagesRes.json();
    renderDashVoyages(voyages.slice(0, 5));
  }

  // Estado flota
  const shipsRes = await apiRequest('/api/ships');
  if (shipsRes && shipsRes.ok) {
    const ships = await shipsRes.json();
    renderFleetStatus(ships);
  }
}

function renderDashVoyages(voyages) {
  const tbody = document.getElementById('dash-voyages-body');
  if (!tbody) return;
  if (!voyages.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.ship?.name ?? '—'}</td>
      <td>${v.client?.user?.name ?? '—'}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

function renderFleetStatus(ships) {
  const list = document.getElementById('fleet-status-list');
  if (!list) return;
  list.innerHTML = ships.map(s => `
    <div class="fleet-status-item">
      <div>
        <div class="fleet-status-name">🚢 ${s.name}</div>
        <div class="fleet-status-type">${SHIP_TYPE_LABELS[s.type] || s.type}</div>
      </div>
      <span class="badge badge-${s.status.toLowerCase()}">${s.status}</span>
    </div>
  `).join('');
}

// ── Barcos ─────────────────────────────────────────────────────
async function loadShips() {
  const res = await apiRequest('/api/ships');
  if (!res || !res.ok) return;
  const ships = await res.json();
  renderShips(ships);
}

function renderShips(ships) {
  const tbody = document.getElementById('ships-body');
  if (!tbody) return;
  if (!ships.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = ships.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${SHIP_TYPE_LABELS[s.type] || s.type}</td>
      <td>${s.flag}</td>
      <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
      <td>${s.captain?.user?.name ?? '—'}</td>
      <td>${s._count?.voyages ?? 0}</td>
      <td>$${s.basePrice.toLocaleString()}/día</td>
      <td>
        <button class="btn-edit" onclick="openEditShip('${s.id}', '${s.name}', '${s.status}', ${s.basePrice})">
          ✏️ ${t('admin.btn.edit')}
        </button>
      </td>
    </tr>
  `).join('');
}

function openEditShip(id, name, status, price) {
  document.getElementById('edit-ship-id').value    = id;
  document.getElementById('edit-ship-name').value  = name;
  document.getElementById('edit-ship-status').value = status;
  document.getElementById('edit-ship-price').value = price;
  document.getElementById('edit-ship-modal').classList.remove('hidden');

  document.getElementById('btn-save-ship').onclick = async () => {
    const newName   = document.getElementById('edit-ship-name').value.trim();
    const newStatus = document.getElementById('edit-ship-status').value;
    const newPrice  = parseFloat(document.getElementById('edit-ship-price').value);

    const res = await apiRequest(`/api/ships/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name: newName, status: newStatus, basePrice: newPrice }),
    });

    if (res && res.ok) {
      closeEditShip();
      loadShips();
      loadDashboard();
    }
  };
}

function closeEditShip() {
  document.getElementById('edit-ship-modal').classList.add('hidden');
}

// ── Viajes ─────────────────────────────────────────────────────
async function loadVoyages() {
  const res = await apiRequest('/api/voyages');
  if (!res || !res.ok) return;
  allVoyages = await res.json();
  renderVoyages(allVoyages);
}

function renderVoyages(voyages) {
  const tbody = document.getElementById('voyages-body');
  if (!tbody) return;
  if (!voyages.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.ship?.name ?? '—'}</td>
      <td>${v.client?.user?.name ?? '—'}</td>
      <td>${new Date(v.departureAt).toLocaleDateString('es-PY')}</td>
      <td>${new Date(v.arrivalAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

function initAdminFilters() {
  document.querySelectorAll('.admin-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const status = btn.getAttribute('data-status');
      const filtered = status === 'ALL' ? allVoyages : allVoyages.filter(v => v.status === status);
      renderVoyages(filtered);
    });
  });
}

// ── Clientes ───────────────────────────────────────────────────
async function loadClients() {
  const res = await apiRequest('/api/users/clients');
  if (!res || !res.ok) return;
  const clients = await res.json();
  renderClients(clients);
}

function renderClients(clients) {
  const tbody = document.getElementById('clients-body');
  if (!tbody) return;
  if (!clients.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = clients.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.client?.totalVoyages ?? 0}</td>
      <td>$${(c.client?.totalSpent ?? 0).toLocaleString()}</td>
      <td>${new Date(c.createdAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge ${c.isActive ? 'badge-completed' : 'badge-cancelled'}">${c.isActive ? 'Activo' : 'Inactivo'}</span></td>
    </tr>
  `).join('');
}

// ── Escalaciones ───────────────────────────────────────────────
async function loadEscalations() {
  const res = await apiRequest('/api/escalations');
  const tbody = document.getElementById('escalations-body');
  if (!tbody) return;

  if (!res || !res.ok) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  const escalations = await res.json();
  if (!escalations.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }

  tbody.innerHTML = escalations.map(e => `
    <tr>
      <td><code>${e.sessionId.slice(0, 12)}...</code></td>
      <td>${e.reason}</td>
      <td><span class="badge badge-${e.status.toLowerCase()}">${e.status}</span></td>
      <td>${new Date(e.createdAt).toLocaleDateString('es-PY')}</td>
    </tr>
  `).join('');
}

// ── Helpers ────────────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function goToAdminSection(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });
  document.querySelectorAll('.portal-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add('active');
}
// ── Crear barco ────────────────────────────────────────────────
function openCreateShip() {
  const modal = document.createElement('div');
  modal.id = 'create-ship-modal';
  modal.className = 'admin-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeCreateShip()"></div>
    <div class="modal-card">
      <h2>🚢 ${t('admin.ship.create')}</h2>
      <div class="form-group">
        <label>${t('admin.table.name')}</label>
        <input type="text" id="create-ship-name" placeholder="MV Nombre del barco" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('admin.table.type')}</label>
          <select id="create-ship-type">
            <option value="CONTAINER">${t('portal.shiptype.CONTAINER')}</option>
            <option value="BULK_CARRIER">${t('portal.shiptype.BULK_CARRIER')}</option>
            <option value="TANKER">${t('portal.shiptype.TANKER')}</option>
            <option value="REEFER">${t('portal.shiptype.REEFER')}</option>
            <option value="HEAVY_LIFT">${t('portal.shiptype.HEAVY_LIFT')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('admin.table.flag')}</label>
          <input type="text" id="create-ship-flag" placeholder="PY" maxlength="2" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('admin.ship.year')}</label>
          <input type="number" id="create-ship-year" placeholder="2020" min="1900" max="2026" />
        </div>
        <div class="form-group">
          <label>${t('portal.ship.baseprice')} (USD/día)</label>
          <input type="number" id="create-ship-price" placeholder="4000" min="1" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('portal.ship.teu')}</label>
          <input type="number" id="create-ship-teu" placeholder="0" min="0" />
        </div>
        <div class="form-group">
          <label>${t('portal.ship.weight')} (tons)</label>
          <input type="number" id="create-ship-weight" placeholder="10000" min="1" />
        </div>
      </div>
      <div class="form-error hidden" id="create-ship-error"></div>
      <div class="modal-actions">
        <button class="btn-primary" id="btn-confirm-create-ship">${t('admin.btn.create')}</button>
        <button class="btn-secondary" onclick="closeCreateShip()">${t('portal.modal.cancel')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('btn-confirm-create-ship').addEventListener('click', async () => {
    const name   = document.getElementById('create-ship-name').value.trim();
    const type   = document.getElementById('create-ship-type').value;
    const flag   = document.getElementById('create-ship-flag').value.trim().toUpperCase();
    const year   = parseInt(document.getElementById('create-ship-year').value);
    const price  = parseFloat(document.getElementById('create-ship-price').value);
    const teu    = parseInt(document.getElementById('create-ship-teu').value) || 0;
    const weight = parseFloat(document.getElementById('create-ship-weight').value);
    const errorEl = document.getElementById('create-ship-error');

    if (!name || !flag || !year || !price || !weight) {
      errorEl.textContent = t('portal.quote.error');
      errorEl.classList.remove('hidden');
      return;
    }

    const btn = document.getElementById('btn-confirm-create-ship');
    btn.disabled = true;
    btn.textContent = t('portal.modal.processing');

    const res = await apiRequest('/api/ships', {
      method: 'POST',
      body: JSON.stringify({ name, flag, type, yearBuilt: year, capacityTeu: teu, maxWeightTons: weight, basePrice: price }),
    });

    if (res && res.ok) {
      closeCreateShip();
      loadShips();
      loadDashboard();
    } else {
      errorEl.textContent = t('portal.quote.error.connection');
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = t('admin.btn.create');
    }
  });
}

function closeCreateShip() {
  const modal = document.getElementById('create-ship-modal');
  if (modal) modal.remove();
}