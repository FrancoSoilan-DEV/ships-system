const btnChat = document.getElementById('btn-chat');
const btnChatCta = document.getElementById('btn-chat-cta');
const btnCloseChat = document.getElementById('btn-close-chat');
const chatWidget = document.getElementById('chat-widget');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');

let chatOpened = false;

function openChat() {
  chatWidget.classList.remove('hidden');
  if (!chatOpened) {
    chatOpened = true;
    setTimeout(() => addMessage('bot', t('chat.welcome')), 400);
  }
  chatInput.focus();
}

if (btnChat) btnChat.addEventListener('click', openChat);
if (btnChatCta) btnChatCta.addEventListener('click', openChat);
if (btnCloseChat) btnCloseChat.addEventListener('click', () => chatWidget.classList.add('hidden'));

if (btnSend) btnSend.addEventListener('click', sendMessage);
if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage('user', text);
  chatInput.value = '';
  showTyping();
  setTimeout(() => {
    removeTyping();
    addMessage('bot', getBotResponse(text));
  }, 1000);
}

function getBotResponse(text) {
  const lower = text.toLowerCase();
  if (currentLang === 'es') {
    if (lower.includes('precio') || lower.includes('costo') || lower.includes('cuánto') || lower.includes('cuanto')) {
      return 'El costo de un viaje depende del tipo de barco, duración, tipo de carga y distancia. ¿Podés contarme más sobre tu carga y destino?';
    }
    if (lower.includes('barco') || lower.includes('flota') || lower.includes('embarcacion')) {
      return 'Contamos con portacontenedores, buques tanque, buques frigoríficos, graneleros y barcos de carga pesada. ¿Qué tipo de carga necesitás transportar?';
    }
    if (lower.includes('hola') || lower.includes('buenas') || lower.includes('hey')) {
      return '¡Hola! ¿En qué puedo ayudarte hoy? Puedo cotizarte un viaje o contarte sobre nuestra flota.';
    }
    if (lower.includes('ruta') || lower.includes('destino') || lower.includes('donde') || lower.includes('dónde')) {
      return 'Operamos rutas en Sudamérica, Europa, Asia y Norteamérica. ¿Cuál es tu puerto de origen y destino?';
    }
    if (lower.includes('cuenta') || lower.includes('registro') || lower.includes('registrar')) {
      return 'Puedo crear tu cuenta ahora mismo. Solo necesito tu nombre completo y correo electrónico. ¿Me los compartís?';
    }
    return 'Entiendo tu consulta. Para darte una respuesta más precisa, te voy a conectar con un asesor humano en breve. ¿Está bien?';
  } else {
    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      return 'The cost of a voyage depends on ship type, duration, cargo type and distance. Can you tell me more about your cargo and destination?';
    }
    if (lower.includes('ship') || lower.includes('fleet') || lower.includes('vessel')) {
      return 'We have container ships, tankers, reefer vessels, bulk carriers and heavy lift ships. What type of cargo do you need to transport?';
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return 'Hello! How can I help you today? I can quote a voyage or tell you about our fleet.';
    }
    if (lower.includes('route') || lower.includes('destination') || lower.includes('where')) {
      return 'We operate routes in South America, Europe, Asia and North America. What are your origin and destination ports?';
    }
    if (lower.includes('account') || lower.includes('register') || lower.includes('sign up')) {
      return 'I can create your account right now. I just need your full name and email address. Can you share them with me?';
    }
    return 'I understand your query. To give you a more accurate answer, I\'ll connect you with a human advisor shortly. Is that okay?';
  }
}

function addMessage(type, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', type);
  msg.innerHTML = text;
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const msg = document.createElement('div');
  msg.classList.add('message', 'bot', 'typing');
  msg.id = 'typing-indicator';
  msg.textContent = '...';
  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-indicator');
  if (el) el.remove();
}