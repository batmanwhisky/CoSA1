// Chat frontend connected to Netlify backend function
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

  async function sendToBackend(message) {
    // Customize this payload as needed for your backend function
    const payload = {
      message: message
    };
    try {
      const response = await fetch('/.netlify/functions/proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      // Adjust this depending on your function's output
      const data = await response.json();
      if (data && data.reply) {
        appendMessage(data.reply, 'bot');
      } else {
        appendMessage('No response from backend.', 'bot');
      }
    } catch (error) {
      appendMessage('Error: ' + error.message, 'bot');
    }
  }

  chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    appendMessage(msg, 'user');
    chatInput.value = '';
    chatForm.querySelector('button').disabled = true;
    sendToBackend(msg).finally(() => {
      chatForm.querySelector('button').disabled = false;
      chatInput.focus();
    });
  });
});