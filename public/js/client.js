/**
 * client.js — lógica específica del portal CLIENT
 * 
 * Maneja:
 * - Carga de estadísticas del cliente
 * - Historial de viajes
 * - Chat con IA para cotizaciones
 * - Perfil del usuario
 */

const sessionId = 'client-' + Math.random().toString(36).slice(2);
const quoteHistory = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar datos del usuario
  const user = await loadUserName();
  if (!user) return;

  // Mostrar avatar con inicial del nombre
  const avatar = document.getElementById('profile-avatar');
  if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();

  // Cargar perfil
  loadProfile(user);

  // Cargar estadísticas y viajes
  loadClientStats(user);

  // Inicializar chat de cotización
  initQuoteChat();

  // Mensaje de bienvenida en el chat
  setTimeout(() => {
    addQuoteMessage('bot', `¡Hola ${user.name}! 👋 Soy tu asistente de Ships System.\n\n¿En qué puedo ayudarte hoy?\n\n1. 🚢 Ver barcos disponibles\n2. 💰 Cotizar un nuevo viaje\n3. 📍 Consultar rutas disponibles`);
  }, 500);
});

// ── Perfil ─────────────────────────────────────────────────────

function loadProfile(user) {
  const nameEl  = document.getElementById('profile-name');
  const emailEl = document.getElementById('profile-email');
  const sinceEl = document.getElementById('profile-since');

  if (nameEl)  nameEl.textContent  = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (sinceEl) sinceEl.textContent = new Date(user.createdAt).toLocaleDateString();
}

// ── Estadísticas ───────────────────────────────────────────────

async function loadClientStats(user) {
  // Buscar el perfil de cliente para obtener métricas
  const res = await apiRequest(`/api/clients/me`);

  if (res && res.ok) {
    const client = await res.json();

    const totalEl  = document.getElementById('stat-total-voyages');
    const spentEl  = document.getElementById('stat-total-spent');
    const activeEl = document.getElementById('stat-active-voyages');

    if (totalEl)  totalEl.textContent  = client.totalVoyages ?? 0;
    if (spentEl)  spentEl.textContent  = `$${(client.totalSpent ?? 0).toLocaleString()}`;
    if (activeEl) activeEl.textContent = client.activeVoyages ?? 0;

    // Cargar viajes recientes
    if (client.voyages && client.voyages.length > 0) {
      renderVoyages(client.voyages);
    }
  } else {
    // Si no hay endpoint todavía, mostrar ceros
    document.getElementById('stat-total-voyages').textContent = '0';
    document.getElementById('stat-total-spent').textContent   = '$0';
    document.getElementById('stat-active-voyages').textContent = '0';
  }
}

// ── Viajes ─────────────────────────────────────────────────────

function renderVoyages(voyages) {
  const recentBody  = document.getElementById('recent-voyages-body');
  const voyagesBody = document.getElementById('voyages-body');

  const rows = voyages.map(v => `
    <tr>
      <td>${v.origin}</td>
      <td>${v.destination}</td>
      <td>${v.ship?.name ?? '—'}</td>
      <td><span class="badge badge-${v.status.toLowerCase()}">${v.status}</span></td>
      <td>$${v.finalCost.toLocaleString()}</td>
    </tr>
  `).join('');

  if (recentBody)  recentBody.innerHTML  = rows;
  if (voyagesBody) voyagesBody.innerHTML = rows;
}

// ── Chat de cotización ─────────────────────────────────────────

function initQuoteChat() {
  const input  = document.getElementById('quote-input');
  const sendBtn = document.getElementById('quote-send');

  if (sendBtn) sendBtn.addEventListener('click', sendQuoteMessage);
  if (input)   input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendQuoteMessage();
  });
}

async function sendQuoteMessage() {
  const input = document.getElementById('quote-input');
  const text  = input.value.trim();
  if (!text) return;

  addQuoteMessage('user', text);
  quoteHistory.push({ role: 'user', content: text });
  input.value = '';
  showQuoteTyping();

  try {
    const res = await fetch('/api/ai-agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        history: quoteHistory.slice(0, -1),
      }),
    });

    const data = await res.json();
    removeQuoteTyping();
    addQuoteMessage('bot', data.message);
    quoteHistory.push({ role: 'assistant', content: data.message });

  } catch {
    removeQuoteTyping();
    addQuoteMessage('bot', '❌ Error de conexión. Intentá de nuevo.');
  }
}

function addQuoteMessage(type, text) {
  const messages = document.getElementById('quote-messages');
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

function showQuoteTyping() {
  const messages = document.getElementById('quote-messages');
  if (!messages) return;
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot', 'typing');
  msg.id = 'quote-typing';
  msg.textContent = '...';
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function removeQuoteTyping() {
  const el = document.getElementById('quote-typing');
  if (el) el.remove();
}