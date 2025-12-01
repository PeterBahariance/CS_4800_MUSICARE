/**
 * Initialize Musicare Chatbot with Playlist Recommendation Integration
 *
 * @param {Object} options - Configuration options
 * @param {string} options.inputId - ID of the input element
 * @param {string} options.sendBtnId - ID of the send button
 * @param {string} options.messagesId - ID of the messages container
 * @param {string} options.apiPath - API endpoint path
 * @returns {Object} - Chatbot interface with sendChat method
 */
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

  /**
   * Append a message to the chat interface
   * @param {string} role - 'user' or 'bot'
   * @param {string} text - Message text
   */
  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = `chat-message ${role}`;
    const label = role === 'user' ? 'You: ' : 'Musicare: ';
    el.textContent = label + text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  /**
   * Set busy state for input controls
   * @param {boolean} isBusy - Whether chatbot is processing
   */
  function setBusy(isBusy) {
    input.disabled = isBusy;
    sendBtn.disabled = isBusy;
    sendBtn.textContent = isBusy ? '...' : 'Send';
  }

  /**
   * Trigger playlist recommendation on home page
   * @param {Object} recommendation - Playlist recommendation metadata
   */
  function triggerPlaylistRecommendation(recommendation) {
    console.log('🎵 Chatbot: Triggering playlist recommendation:', recommendation);

    // Dispatch custom event to update home page playlists
    window.dispatchEvent(new CustomEvent('musicare:chatbot-playlist-recommendation', {
      detail: {
        type: recommendation.type,
        key: recommendation.key,
        mood: recommendation.mood,
        timestamp: new Date().toISOString()
      }
    }));

    // Show visual feedback
    appendMessage('bot', '🎵 Loading personalized playlists for you...');
  }

  /**
   * Send chat message and handle response
   */
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

      // Display chatbot response
      appendMessage('bot', data.reply || 'No reply from server.');

      // If playlist recommendation is included, trigger playlist update
      if (data.playlistRecommendation) {
        console.log('🎵 Chatbot: Received playlist recommendation:', data.playlistRecommendation);
        triggerPlaylistRecommendation(data.playlistRecommendation);
      }

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

  console.log('🤖 Chatbot: Initialized with playlist recommendation support');
  return { sendChat };
}
