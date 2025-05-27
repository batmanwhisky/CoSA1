const API_URL = "https://discoveryengine.googleapis.com/v1alpha/projects/310961014296/locations/global/collections/default_collection/engines/cosa1_1748271255057/servingConfigs/default_search:search";

const chatWindow = document.getElementById("chat-window");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

// You may need to adjust this payload structure depending on your chatbot API's requirements
function createPayload(message) {
  return {
    query: message
  };
}

function addMessage(text, sender = "user") {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  msgDiv.appendChild(bubble);
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

async function sendMessageToBot(message) {
  addMessage(message, "user");
  addMessage("...", "bot"); // loading indicator

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(createPayload(message))
    });

    // Remove loading indicator
    const loading = chatWindow.querySelector(".bot .bubble:last-child");
    if (loading && loading.textContent === "...") {
      loading.parentElement.parentElement.remove();
    }

    if (response.ok) {
      const data = await response.json();
      // You might need to adjust this depending on your response shape
      const botReply =
        (data.candidates && data.candidates[0] && data.candidates[0].output) ||
        JSON.stringify(data);
      addMessage(botReply, "bot");
    } else {
      addMessage("Sorry, there was an error connecting to the chatbot.", "bot");
    }
  } catch (err) {
    // Remove loading indicator if present
    const loading = chatWindow.querySelector(".bot .bubble:last-child");
    if (loading && loading.textContent === "...") {
      loading.parentElement.parentElement.remove();
    }
    addMessage("Sorry, there was a network error.", "bot");
  }
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = userInput.value.trim();
  if (message) {
    sendMessageToBot(message);
    userInput.value = "";
    userInput.focus();
  }
});