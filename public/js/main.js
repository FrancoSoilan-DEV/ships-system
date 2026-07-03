const btnChat = document.getElementById('btn-chat');
const btnChatCta = document.getElementById('btn-chat-cta');
const btnCloseChat = document.getElementById('btn-close-chat');
const chatWidget = document.getElementById('chat-widget');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');

let chatOpened = false;

// ID único de sesión para esta visita
const sessionId = 'session-' + Math.random().toString(36).slice(2);

// Historial de la conversación para darle contexto a la IA
const conversationHistory = [];

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

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });
  chatInput.value = '';
  showTyping();

  try {
    const res = await fetch('/api/ai-agent/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        message: text,
        // Mandamos el historial sin el mensaje actual (ya lo manda en message)
        history: conversationHistory.slice(0, -1),
      }),
    });

    const data = await res.json();
    removeTyping();
    addMessage('bot', data.message);
    conversationHistory.push({ role: 'assistant', content: data.message });

  } catch {
    removeTyping();
    addMessage('bot', currentLang === 'es'
      ? 'Error de conexión. Intentá de nuevo.'
      : 'Connection error. Please try again.'
    );
  }
}

function addMessage(type, text) {
  const msg = document.createElement('div');
  msg.classList.add('message', type);
  
  // Convertir saltos de línea y formato básico a HTML
  const formatted = text
    .replace(/\n\n/g, '</p><p>')           // párrafos
    .replace(/\n/g, '<br/>')               // saltos de línea
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **negrita**
    .replace(/\*(.*?)\*/g, '<em>$1</em>'); // *itálica*

  msg.innerHTML = `<p>${formatted}</p>`;
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