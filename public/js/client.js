/**
 * client.js — lógica del portal CLIENT
 */

const SHIP_TYPE_LABELS = {
  CONTAINER:    '📦 Contenedor',
  BULK_CARRIER: '⚓ Granelero',
  TANKER:       '🛢️ Tanquero',
  REEFER:       '❄️ Frigorífico',
  HEAVY_LIFT:   '🏗️ Carga pesada',
};

const CARGO_TYPE_LABELS = {
  GENERAL:      'General',
  REFRIGERATED: 'Refrigerada',
  HAZARDOUS:    'Peligrosa',
  BULK:         'A granel',
  OVERSIZED:    'Sobredimensionada',
};

let allShips = [];
const supportHistory = [];
const supportSessionId = 'support-' + Math.random().toString(36).slice(2);

// ── Inicialización ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const user = await loadUserName();
  if (!user) return;

  const welcomeEl = document.getElementById('dashboard-welcome');
  if (welcomeEl) welcomeEl.textContent = `¡Bienvenido, ${user.name}!`;

  const avatar = document.getElementById('profile-avatar');
  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();

  loadProfile(user);
  loadStats();
  loadFleet();
  loadMyVoyages();
  initQuotator();
  initSupport();
});

// ── Perfil ─────────────────────────────────────────────────────
function loadProfile(user) {
  const nameEl  = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const sinceEl = document.getElementById('profile-since');
  if (nameEl)  nameEl.textContent  = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (sinceEl) sinceEl.textContent = new Date(user.createdAt).toLocaleDateString('es-PY');
}

// ── Stats ──────────────────────────────────────────────────────
async function loadStats() {
  const shipsRes = await apiRequest('/api/ships/available');
  if (shipsRes && shipsRes.ok) {
    const ships = await shipsRes.json();
    const el = document.getElementById('stat-available-ships');
    if (el) el.textContent = ships.length;
  }

  const voyagesRes = await apiRequest('/api/voyages/my');
  if (voyagesRes && voyagesRes.ok) {
    const voyages = await voyagesRes.json();
    const totalEl  = document.getElementById('stat-total-voyages');
    const activeEl = document.getElementById('stat-active-voyages');
    const spentEl  = document.getElementById('stat-total-spent');

    if (totalEl)  totalEl.textContent  = voyages.length;
    if (activeEl) activeEl.textContent = voyages.filter(v => v.status === 'IN_PROGRESS').length;
    if (spentEl)  spentEl.textContent  = '$' + voyages.reduce((sum, v) => sum + v.finalCost, 0).toLocaleString();

    renderRecentVoyages(voyages.slice(0, 5));
  } else {
    ['stat-total-voyages', 'stat-active-voyages'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '0';
    });
    const spentEl = document.getElementById('stat-total-spent');
    if (spentEl) spentEl.textContent = '$0';
  }
}

// ── Flota ──────────────────────────────────────────────────────
async function loadFleet() {
  const res = await apiRequest('/api/ships/available');
  if (!res || !res.ok) {
    document.getElementById('fleet-grid').innerHTML = '<div class="loading-state">Error cargando barcos.</div>';
    return;
  }

  allShips = await res.json();
  renderFleet(allShips);
  populateShipSelect(allShips);

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      const filtered = type === 'ALL' ? allShips : allShips.filter(s => s.type === type);
      renderFleet(filtered);
    });
  });
}

function renderFleet(ships) {
  const grid = document.getElementById('fleet-grid');
  if (!ships.length) {
    grid.innerHTML = '<div class="loading-state">No hay barcos disponibles con ese filtro.</div>';
    return;
  }

  grid.innerHTML = ships.map(ship => `
    <div class="ship-card-portal" onclick="selectShipForQuote('${ship.id}')">
      <div class="ship-card-top">
        <span class="ship-type-tag">${SHIP_TYPE_LABELS[ship.type] || ship.type}</span>
        <span>${ship.flag}</span>
      </div>
      <div class="ship-card-name">🚢 ${ship.name}</div>
      <div class="ship-card-specs">
        <div class="ship-spec">
          <span>Año de construcción</span>
          <strong>${ship.yearBuilt}</strong>
        </div>
        <div class="ship-spec">
          <span>Capacidad TEU</span>
          <strong>${ship.capacityTeu > 0 ? ship.capacityTeu.toLocaleString() : 'N/A'}</strong>
        </div>
        <div class="ship-spec">
          <span>Peso máximo</span>
          <strong>${ship.maxWeightTons.toLocaleString()} tons</strong>
        </div>
      </div>
      <div class="ship-card-price">
        <div>
          <div class="ship-price-label">Precio base</div>
          <div class="ship-price-value">$${ship.basePrice.toLocaleString()}/día</div>
        </div>
        <button class="btn-quote-ship" onclick="event.stopPropagation(); selectShipForQuote('${ship.id}')">
          Cotizar →
        </button>
      </div>
    </div>
  `).join('');
}

function populateShipSelect(ships) {
  const select = document.getElementById('quote-ship');
  if (!select) return;
  ships.forEach(ship => {
    const opt = document.createElement('option');
    opt.value = ship.id;
    opt.textContent = `${ship.name} — $${ship.basePrice.toLocaleString()}/día`;
    select.appendChild(opt);
  });
}

function selectShipForQuote(shipId) {
  goToSection('quote');
  const select = document.getElementById('quote-ship');
  if (select) select.value = shipId;
}

// ── Cotizador ──────────────────────────────────────────────────
function initQuotator() {
  const btnQuote = document.getElementById('btn-quote');
  if (btnQuote) btnQuote.addEventListener('click', calculateQuote);

  const btnRecalc = document.getElementById('btn-recalculate');
  if (btnRecalc) btnRecalc.addEventListener('click', () => {
    document.getElementById('quote-result').classList.add('hidden');
  });

  const btnContact = document.getElementById('btn-contact-quote');
  if (btnContact) btnContact.addEventListener('click', () => {
    showBookingModal();
  });
}

async function calculateQuote() {
  const shipId   = document.getElementById('quote-ship').value;
  const origin   = document.getElementById('quote-origin').value.trim();
  const dest     = document.getElementById('quote-destination').value.trim();
  const cargo    = document.getElementById('quote-cargo').value;
  const days     = parseInt(document.getElementById('quote-days').value);
  const distance = parseInt(document.getElementById('quote-distance').value);
  const errorEl  = document.getElementById('quote-error');

  if (!shipId || !origin || !dest || !days || !distance) {
    errorEl.textContent = 'Completá todos los campos.';
    errorEl.classList.remove('hidden');
    return;
  }

  errorEl.classList.add('hidden');

  const btn = document.getElementById('btn-quote');
  btn.disabled = true;
  btn.textContent = 'Calculando...';

  try {
    const res = await apiRequest('/api/voyages/quote', {
      method: 'POST',
      body: JSON.stringify({
        shipId,
        origin,
        destination: dest,
        cargoType: cargo,
        durationDays: days,
        distanceKm: distance,
      }),
    });

    if (!res || !res.ok) {
      const err = await res.json();
      errorEl.textContent = err.message || 'Error al calcular.';
      errorEl.classList.remove('hidden');
      return;
    }

    const data = await res.json();

    document.getElementById('res-ship').textContent       = data.ship.name;
    document.getElementById('res-route').textContent      = `${origin} → ${dest}`;
    document.getElementById('res-days').textContent       = `${days} días`;
    document.getElementById('res-cargo').textContent      = CARGO_TYPE_LABELS[cargo] || cargo;
    document.getElementById('res-base').textContent       = `$${data.ship.basePrice.toLocaleString()}/día`;
    document.getElementById('res-ship-mult').textContent  = `×${data.shipMultiplier}`;
    document.getElementById('res-cargo-mult').textContent = `×${data.cargoMultiplier}`;
    document.getElementById('res-dist-mult').textContent  = `×${data.distanceMultiplier}`;
    document.getElementById('res-total').textContent      = `$${data.finalCost.toLocaleString()} USD`;

    document.getElementById('quote-result').classList.remove('hidden');

  } catch {
    errorEl.textContent = 'Error de conexión.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Calcular cotización';
  }
}

// ── Mis viajes ─────────────────────────────────────────────────
async function loadMyVoyages() {
  const res = await apiRequest('/api/voyages/my');
  if (!res || !res.ok) return;

  const voyages = await res.json();
  renderRecentVoyages(voyages.slice(0, 5));
  renderAllVoyages(voyages);
}

function renderRecentVoyages(voyages) {
  const tbody = document.getElementById('recent-voyages-body');
  if (!tbody) return;
  if (!voyages.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Sin viajes registrados</td></tr>';
    return;
  }
  tbody.innerHTML = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.ship?.name ?? '—'}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

function renderAllVoyages(voyages) {
  const tbody = document.getElementById('voyages-body');
  if (!tbody) return;
  if (!voyages.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">Sin viajes registrados</td></tr>';
    return;
  }
  tbody.innerHTML = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.ship?.name ?? '—'}</td>
      <td>${new Date(v.departureAt).toLocaleDateString('es-PY')}</td>
      <td>${new Date(v.arrivalAt).toLocaleDateString('es-PY')}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');
}

// ── Modal de contratación ──────────────────────────────────────
function showBookingModal() {
  const ship  = document.getElementById('res-ship')?.textContent;
  const route = document.getElementById('res-route')?.textContent;
  const days  = document.getElementById('res-days')?.textContent;
  const total = document.getElementById('res-total')?.textContent;

  const modal = document.createElement('div');
  modal.id = 'booking-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="closeBookingModal()"></div>
    <div class="modal-card">
      <h2>✅ Confirmar contratación</h2>
      <div class="modal-summary">
        <div class="breakdown-item"><span>🚢 Barco</span><strong>${ship}</strong></div>
        <div class="breakdown-item"><span>📍 Ruta</span><strong>${route}</strong></div>
        <div class="breakdown-item"><span>📅 Duración</span><strong>${days}</strong></div>
        <div class="breakdown-total"><span>💰 Total</span><strong>${total}</strong></div>
      </div>
      <div class="form-group" style="margin-top:1rem">
        <label>📅 Fecha de salida</label>
        <input type="date" id="booking-departure" min="${new Date().toISOString().split('T')[0]}" />
      </div>
      <div class="form-group">
        <label>⚖️ Peso de la carga (tons)</label>
        <input type="number" id="booking-weight" placeholder="Ej: 5000" min="1" />
      </div>
      <div class="form-error hidden" id="booking-error"></div>
      <div class="modal-actions">
        <button class="btn-primary" id="btn-confirm-booking">Confirmar contratación</button>
        <button class="btn-secondary" onclick="closeBookingModal()">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('btn-confirm-booking').addEventListener('click', confirmBooking);
}

function closeBookingModal() {
  const modal = document.getElementById('booking-modal');
  if (modal) modal.remove();
}

async function confirmBooking() {
  const departure = document.getElementById('booking-departure').value;
  const weight    = parseInt(document.getElementById('booking-weight').value);
  const errorEl   = document.getElementById('booking-error');

  if (!departure || !weight) {
    errorEl.textContent = 'Completá todos los campos.';
    errorEl.classList.remove('hidden');
    return;
  }

  const btn = document.getElementById('btn-confirm-booking');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  const shipId   = document.getElementById('quote-ship').value;
  const origin   = document.getElementById('quote-origin').value.trim();
  const dest     = document.getElementById('quote-destination').value.trim();
  const cargo    = document.getElementById('quote-cargo').value;
  const days     = parseInt(document.getElementById('quote-days').value);
  const distance = parseInt(document.getElementById('quote-distance').value);

  try {
    const res = await apiRequest('/api/voyages', {
      method: 'POST',
      body: JSON.stringify({
        shipId,
        origin,
        destination:  dest,
        cargoType:    cargo,
        durationDays: days,
        distanceKm:   distance,
        weightTons:   weight,
        departureAt:  departure,
      }),
    });

    if (!res || !res.ok) {
      const err = await res.json();
      errorEl.textContent = err.message || 'Error al contratar.';
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = 'Confirmar contratación';
      return;
    }

    closeBookingModal();
    document.getElementById('quote-result').classList.add('hidden');
    alert('🎉 ¡Viaje contratado exitosamente! Podés verlo en "Mis viajes".');
    goToSection('voyages');
    loadMyVoyages();

  } catch {
    errorEl.textContent = 'Error de conexión.';
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Confirmar contratación';
  }
}

// ── Soporte ────────────────────────────────────────────────────
function initSupport() {
  const btnOpen  = document.getElementById('btn-open-support-chat');
  const btnClose = document.getElementById('btn-close-support-chat');
  const btnSend  = document.getElementById('support-send');
  const input    = document.getElementById('support-input');
  const chat     = document.getElementById('support-chat');

  if (btnOpen) btnOpen.addEventListener('click', () => {
    chat.classList.remove('hidden');
    if (!supportHistory.length) {
      addSupportMessage('bot', '¡Hola! 👋 Soy el asistente de soporte de Ships System.\n\n¿En qué puedo ayudarte hoy?');
    }
  });

  if (btnClose) btnClose.addEventListener('click', () => chat.classList.add('hidden'));
  if (btnSend)  btnSend.addEventListener('click', sendSupportMessage);
  if (input)    input.addEventListener('keypress', e => { if (e.key === 'Enter') sendSupportMessage(); });
}

async function sendSupportMessage() {
  const input = document.getElementById('support-input');
  const text  = input.value.trim();
  if (!text) return;

  addSupportMessage('user', text);
  supportHistory.push({ role: 'user', content: text });
  input.value = '';

  const typingEl = document.createElement('div');
  typingEl.classList.add('message', 'bot', 'typing');
  typingEl.id = 'support-typing';
  typingEl.textContent = '...';
  document.getElementById('support-messages').appendChild(typingEl);

  try {
    const res = await fetch('/api/ai-agent/support', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        sessionId: supportSessionId,
        message: text,
        history: supportHistory.slice(0, -1),
      }),
    });
    const data = await res.json();
    document.getElementById('support-typing')?.remove();
    addSupportMessage('bot', data.message);
    supportHistory.push({ role: 'assistant', content: data.message });
  } catch {
    document.getElementById('support-typing')?.remove();
    addSupportMessage('bot', '❌ Error de conexión. Intentá de nuevo.');
  }
}

function addSupportMessage(type, text) {
  const messages = document.getElementById('support-messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.classList.add('message', type);
  const formatted = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  msg.innerHTML = `<p>${formatted}</p>`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

// ── Helper navegación ──────────────────────────────────────────
function goToSection(sectionId) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-section') === sectionId);
  });
  document.querySelectorAll('.portal-section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`section-${sectionId}`);
  if (target) target.classList.add('active');
}