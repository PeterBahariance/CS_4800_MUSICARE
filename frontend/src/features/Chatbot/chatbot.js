export function initChat(options = {}) {
  const {
    inputId = 'chat-input',
    sendBtnId = 'chat-send-btn',
    messagesId = 'chat-messages',
    apiPath = '/api/chat'
  } = options;

  const input = document.getElementById(inputId);
  const sendBtn = document.getElementById(sendBtnId);
  const messages = document.getElementById(messagesId);

  if (!input || !sendBtn || !messages) {
    console.warn(`initChat: Missing elements (#${inputId}, #${sendBtnId}, #${messagesId}).`);
    return;
  }

  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = `chat-message ${role}`;
    const label = role === 'user' ? 'You: ' : 'Musicare: ';
    el.textContent = label + text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  function setBusy(isBusy) {
    input.disabled = isBusy;
    sendBtn.disabled = isBusy;
    sendBtn.textContent = isBusy ? '...' : 'Send';
  }

  async function sendChat() {
    const text = input.value.trim();
    if (!text) return;
    appendMessage('user', text);
    input.value = '';
    setBusy(true);

    const loadingEl = document.createElement('div');
    loadingEl.className = 'chat-message bot loading';
    loadingEl.textContent = 'Musicare is typing...';
    messages.appendChild(loadingEl);
    messages.scrollTop = messages.scrollHeight;

    try {
      const resp = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        loadingEl.remove();
        appendMessage('bot', 'Error: ' + (errBody.error || `HTTP ${resp.status}`));
        console.error('Chat API error', resp.status, errBody);
        return;
      }

      const data = await resp.json().catch(() => ({}));
      loadingEl.remove();
      appendMessage('bot', data.reply || 'No reply from server.');
    } catch (err) {
      loadingEl.remove();
      appendMessage('bot', 'Network error. Please try again.');
      console.error('Network error while contacting chat API', err);
    } finally {
      setBusy(false);
    }
  }

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sendChat();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  });

  return { sendChat };
}
