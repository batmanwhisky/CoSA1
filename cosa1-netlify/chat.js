// Simple frontend chat logic (local only, no backend)
document.addEventListener('DOMContentLoaded', function() {
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-container');

  function appendMessage(text, sender = 'user') {
    const div = document.createElement('div');
    div.className = 'chat-message ' + sender;
    div.textContent = text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage(msg, 'user');
    chatInput.value = '';

    // Fake bot response for demo
    setTimeout(() => {
      appendMessage("You said: " + msg, 'bot');
    }, 600);
  });

});