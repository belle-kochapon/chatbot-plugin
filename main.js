// This script handles the entire chatbot user interface and functionality.

// Chat Toggle
class ChatbotUI {
  constructor(rootId) {
    this.root = document.getElementById(rootId);
    this.renderToggle(); 
    this.renderChatWindow();

    // Get references to DOM Elements
    this.chatWindow = document.getElementById('chat-window');
    this.messageContainer = this.chatWindow.querySelector('.overflow-y-auto'); // the container where messages will be displayed
    this.messageInput = this.chatWindow.querySelector('textarea');
    this.sendButton = this.chatWindow.querySelector('.send-button');

    // Event Listeners
    this.setupToggleListener();

    // Welcome message
    this.renderMessage('Hello! How can I help you today?', 'bot');
  }

  // Chat Toggle 
  renderToggle() {
    const toggleHTML = `
      <div class="fixed bottom-6 right-6 z-50">
        <button id="chat-toggle" class="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition text-base">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" /> 
          </svg> Chat
        </button>
      </div>
    `;
    this.root.insertAdjacentHTML('beforeend', toggleHTML);
  }

  // Chat Window
  renderChatWindow() {
  const chatHTML = `
    <div id="chat-window" class="hidden fixed bottom-20 right-6 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50 text-base">
      <div class="bg-indigo-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <span>Chat with us</span>
        <button id="chat-close" aria-label="Close chat">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />            
          </svg>
        </button>
      </div>

      <div class="flex-1 p-3 overflow-y-auto space-y-2">
        <!-- Messages will go here -->
      </div>

      <div class="p-3 border-t border-gray-200">
        <div class="flex items-center gap-2">
          <textarea
            rows="1"
            placeholder="Type a message..."
            class="flex-1 resize-none border rounded px-2 py-1 focus:outline-none overflow-hidden"
            oninput="this.style.height = ''; this.style.height = this.scrollHeight + 'px';"
          ></textarea>
          <button class="send-button text-gray-600">
            <svg xmlns="http://www.w3.org/200/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  this.root.insertAdjacentHTML('beforeend', chatHTML);
}

  // Conversation Window
  renderMessage(text, sender) {
    const isUser = sender === 'user';
    const messageClass = isUser ? 'bg-indigo-600 text-white self-end' : 'bg-gray-200 text-gray-800 self-start';
    const messageHTML = `
      <div class="flex ${isUser ? 'justify-end' : 'justify-start'}">
        <div class="rounded-xl px-4 py-2 max-w-[80%] ${messageClass} break-words">
          ${text}
        </div>
      </div>
    `;
    this.messageContainer.insertAdjacentHTML('beforeend', messageHTML);
    // Automatically scroll to the bottom of the chat window
    this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    
    // To allow the element to be removed later
    return this.messageContainer.lastElementChild;
  }

  // Open/Close Chat Window
setupToggleListener() {
  const toggleButton = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  const closeButton = document.getElementById('chat-close');

  toggleButton.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
  });

  // Close chat window when the close button is clicked
  closeButton.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
  });

  // Send message
  this.messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevents a new line from being added
        this.handleSendMessage();
      }
    });

    this.sendButton.addEventListener('click', () => {
      this.handleSendMessage();
    });
}

// Handles sending a message from user and bot
  async handleSendMessage() {
    const userMessage = this.messageInput.value.trim();
    if (userMessage) {
      // User's message
      this.renderMessage(userMessage, 'user');
      this.messageInput.value = '';
      this.messageInput.style.height = 'auto'; // Reset the textarea height

      // Loading message
      const loadingMessageElement = this.renderMessage('...', 'bot');

      //  Error handling
      try {
        const botResponse = await this.fetchBotResponse(userMessage);
        // Remove the loading message and display the actual bot response.
        if (loadingMessageElement) loadingMessageElement.remove();
        this.renderMessage(botResponse, 'bot');
      } catch (error) {
        console.error('API call failed:', error);
        if (loadingMessageElement) loadingMessageElement.remove();
        this.renderMessage('Sorry, I am unable to respond right now.', 'bot');
      }
    }
  }

  // A function to call the WordPress backend, which acts as a proxy to the n8n API.
async fetchBotResponse(userMessage) {
    try {
        const params = new URLSearchParams();
        params.append('action', 'chatbot_request');
        params.append('message', userMessage);
        params.append('nonce', chatbot_data.nonce);

        const res = await fetch(chatbot_data.ajax_url, {
            method: 'POST',
            body: params
        });

        if (!res.ok) {
            throw new Error('Failed to get response from server.');
        }

        const data = await res.json();
        
        if (data.success) {
            // The n8n response is expected to be in a nested property.
            return data.data.reply || data.data.response || 'No reply received.';
        } else {
            throw new Error(data.data || 'An error occurred on the server.');
        }
    } catch (err) {
        console.error('Error fetching bot response:', err);
        throw err;
    }
}
}



new ChatbotUI('app');