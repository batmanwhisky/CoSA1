// Enhanced chat frontend: session history, avatars, markdown, spinner, error handling, conversation context
(function () {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-container');
  const loading = document.getElementById('chat-loading');
  const clearBtn = document.getElementById('clear-chat');

  // Conversation persists for the session
  let conversation = loadConversation();

  renderConversation();

  // Auto-resize textarea height
  chatInput.addEventListener('input', autoGrow);

  // Handle Enter vs. Shift+Enter
  chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });

  // Submit message
  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addMessage(msg, 'user');
    chatInput.value = '';
    autoGrow({ target: chatInput });
    showLoading(true);
    chatForm.querySelector('button').disabled = true;
    sendToBackend(conversation)
      .then(botReply => {
        addMessage(botReply, 'bot');
      })
      .catch(err => {
        addMessage('❌ ' + err.message, 'bot');
      })
      .finally(() => {
        showLoading(false);
        chatForm.querySelector('button').disabled = false;
        chatInput.focus();
      });
  });

  // Clear conversation
  clearBtn.addEventListener('click', function () {
    if (confirm('Clear this conversation?')) {
      conversation = [];
      saveConversation();
      renderConversation();
    }
  });

  // Scroll to latest message
  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Add message to conversation and render
  function addMessage(text, sender) {
    const msg = {
      text,
      sender,
      ts: Date.now()
    };
    conversation.push(msg);
    saveConversation();
    renderMessage(msg);
    scrollToBottom();
  }

  // Render all messages
  function renderConversation() {
    chatContainer.innerHTML = '';
    conversation.forEach(renderMessage);
    scrollToBottom();
  }

  // Render a single message row (fixed to never append null nodes)
  function renderMessage(msg) {
    const row = document.createElement('div');
    row.className = 'chat-row ' + msg.sender;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'avatar ' + msg.sender;
    avatar.textContent = msg.sender === 'user' ? '🧑' : '🤖';

    // Bubble with markdown
    const bubble = document.createElement('div');
    bubble.className = 'chat-message-bubble';
    bubble.innerHTML = safeMarkdown(msg.text);

    // Timestamp
    const time = document.createElement('div');
    time.className = 'chat-time';
    time.textContent = formatTime(msg.ts);

    bubble.appendChild(time);

    if (msg.sender === 'user') row.appendChild(avatar);
    row.appendChild(bubble);
    if (msg.sender === 'bot') row.appendChild(avatar);

    chatContainer.appendChild(row);
  }

  // Save/load session conversation
  function saveConversation() {
    sessionStorage.setItem('cosa1-chat-history', JSON.stringify(conversation));
  }
  function loadConversation() {
    try {
      return JSON.parse(sessionStorage.getItem('cosa1-chat-history')) || [];
    } catch {
      return [];
    }
  }

  // Loading spinner show/hide
  function showLoading(show) {
    loading.classList.toggle('hidden', !show);
  }

  // Auto-grow textarea
  function autoGrow(e) {
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  }

  // Format timestamp
  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Markdown: supports code, bold, italic, links (very basic/safe)
  function safeMarkdown(text) {
    let s = text
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // Inline code: `code`
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold: **bold**
    s = s.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    // Italic: *italic*
    s = s.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return s.replace(/\n/g, "<br>");
  }

  // Send to backend with conversation context
  async function sendToBackend(convo) {
    const payload = {
      conversation: convo.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
        ts: m.ts
      }))
    };
    // Replace 'chatbot' with your actual Netlify Function name
    const FUNCTION_NAME = 'proxy'; // <-- change this if your function is named differently
    const response = await fetch(`https://cosa1.netlify.app/.netlify/functions/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    // Try to extract a message from the backend, even when error status
    let data, raw;
    try {
      raw = await response.text();
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
    if (response.ok) {
      if (data && data.reply) return data.reply;
      if (typeof data === 'string') return data;
      if (raw) return raw;
      throw new Error('No response from backend');
    } else {
      // Attempt to show backend error message if available
      if (data && data.error) throw new Error(data.error);
      throw new Error('Network error');
    }
  }
})();