/**
 * captain.js — lógica del portal CAPTAIN
 */

const SHIP_TYPE_LABELS = {
  CONTAINER:    '📦 Contenedor',
  BULK_CARRIER: '⚓ Granelero',
  TANKER:       '🛢️ Tanquero',
  REEFER:       '❄️ Frigorífico',
  HEAVY_LIFT:   '🏗️ Carga pesada',
};

let myShip = null;

// ── Inicialización ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await loadUserName();
  if (!user) return;

  // Verificar rol
  const token = localStorage.getItem('accessToken');
  const payload = JSON.parse(atob(token.split('.')[1]));
  if (payload.role !== 'CAPTAIN') {
    window.location.href = '/login.html';
    return;
  }

  // Bienvenida personalizada
  const welcomeEl = document.getElementById('captain-welcome');
  if (welcomeEl) welcomeEl.textContent = `${t('captain.dashboard.title')}, ${user.name}!`;

  // Avatar
  const avatar = document.getElementById('profile-avatar');
  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();

  loadProfile(user);
  await loadMyShip();
  loadDashboard();
});

// ── Perfil ─────────────────────────────────────────────────────
function loadProfile(user) {
  const nameEl    = document.getElementById('profile-name');
  const emailEl   = document.getElementById('profile-email');
  const sinceEl   = document.getElementById('profile-since');
  if (nameEl)  nameEl.textContent  = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (sinceEl) sinceEl.textContent = new Date(user.createdAt).toLocaleDateString('es-PY');
}

// ── Mi barco ───────────────────────────────────────────────────
async function loadMyShip() {
  const res = await apiRequest('/api/ships/my');
  if (!res || !res.ok) {
    document.getElementById('ship-detail').innerHTML = `
      <div class="no-ship-msg">
        <div style="font-size:3rem">⚓</div>
        <h3>${t('captain.no.ship')}</h3>
        <p>${t('captain.no.ship.desc')}</p>
      </div>
    `;
    return;
  }

  myShip = await res.json();
  if (!myShip) return;

  // Stat del barco en dashboard
  const shipNameEl = document.getElementById('stat-ship-name');
  if (shipNameEl) shipNameEl.textContent = myShip.name;

  // Crew count
  const crewEl = document.getElementById('stat-crew-count');
  if (crewEl) crewEl.textContent = myShip.crew?.length ?? 0;

  // Detalle del barco
  renderShipDetail(myShip);

  // Tripulación
  renderCrew(myShip.crew ?? []);

  // Licencia del capitán
  const licenseEl = document.getElementById('profile-license');
  if (licenseEl && myShip.captain?.licenseNumber) {
    licenseEl.textContent = myShip.captain.licenseNumber;
  }
}

function renderShipDetail(ship) {
  const container = document.getElementById('ship-detail');
  if (!container) return;

  container.innerHTML = `
    <div class="ship-detail-grid">
      <div class="ship-detail-main">
        <div class="ship-detail-header">
          <div>
            <span class="ship-type-tag">${SHIP_TYPE_LABELS[ship.type] || ship.type}</span>
            <h2 class="ship-detail-name">🚢 ${ship.name}</h2>
          </div>
          <span class="badge badge-${ship.status.toLowerCase()}">${ship.status}</span>
        </div>
        <div class="ship-specs-grid">
          <div class="ship-spec-item">
            <div class="spec-label">${t('portal.ship.teu')}</div>
            <div class="spec-value">${ship.capacityTeu > 0 ? ship.capacityTeu.toLocaleString() : 'N/A'}</div>
          </div>
          <div class="ship-spec-item">
            <div class="spec-label">${t('portal.ship.weight')}</div>
            <div class="spec-value">${ship.maxWeightTons.toLocaleString()} tons</div>
          </div>
          <div class="ship-spec-item">
            <div class="spec-label">${t('admin.table.flag')}</div>
            <div class="spec-value">${ship.flag}</div>
          </div>
          <div class="ship-spec-item">
            <div class="spec-label">${t('admin.ship.year')}</div>
            <div class="spec-value">${ship.yearBuilt}</div>
          </div>
          <div class="ship-spec-item">
            <div class="spec-label">${t('portal.ship.baseprice')}</div>
            <div class="spec-value accent">$${ship.basePrice.toLocaleString()}/${t('portal.ship.day')}</div>
          </div>
          <div class="ship-spec-item">
            <div class="spec-label">${t('captain.stat.voyages')}</div>
            <div class="spec-value">${ship._count?.voyages ?? 0}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Dashboard ──────────────────────────────────────────────────
async function loadDashboard() {
  if (!myShip) return;

  const res = await apiRequest(`/api/voyages/ship/${myShip.id}`);
  if (!res || !res.ok) return;

  const voyages = await res.json();

  const totalEl  = document.getElementById('stat-total-voyages');
  const activeEl = document.getElementById('stat-active-voyages');
  if (totalEl)  totalEl.textContent  = voyages.length;
  if (activeEl) activeEl.textContent = voyages.filter(v => v.status === 'IN_PROGRESS').length;

  renderDashVoyages(voyages.slice(0, 5));
  renderAllVoyages(voyages);
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
      <td>${v.client?.user?.name ?? '—'}</td>
      <td>${new Date(v.departureAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

function renderAllVoyages(voyages) {
  const tbody = document.getElementById('voyages-body');
  if (!tbody) return;
  if (!voyages.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">${t('portal.table.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.client?.user?.name ?? '—'}</td>
      <td>${new Date(v.departureAt).toLocaleDateString('es-PY')}</td>
      <td>${new Date(v.arrivalAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

// ── Tripulación ────────────────────────────────────────────────
function renderCrew(crew) {
  const tbody = document.getElementById('crew-body');
  if (!tbody) return;
  if (!crew.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="table-empty">${t('captain.crew.empty')}</td></tr>`;
    return;
  }
  tbody.innerHTML = crew.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>${c.role}</td>
      <td>${c.nationality}</td>
      <td>${new Date(c.joinedAt).toLocaleDateString('es-PY')}</td>
    </tr>
  `).join('');
}

// ── Helper navegación ──────────────────────────────────────────
function goToCaptainSection(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });
  document.querySelectorAll('.portal-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add('active');
}