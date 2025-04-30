//script.js
// Create a script.js file and include it in your HTML
let isAdmin = false; // Add flag for admin status

async function checkAdminStatus() {
    try {
        const response = await fetch('http://34.51.132.126:3000/api/user/role', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch user role');
        }
        
        const data = await response.json();
        isAdmin = data.role === 'ADMIN';
        //console.log('Admin status:', isAdmin);
    } catch (error) {
        console.error('Error checking admin status:', error);
    }
}
export { isAdmin, checkAdminStatus };
const balanceDisplay = document.querySelector('.betButtons p');
async function updateBalance() {
    try {
        const response = await fetch('http://34.51.132.126:3000/api/balance', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        });
        
        //console.log(response);

        if (!response.ok) {
            throw new Error('Failed to fetch balance');
        }
        
        const data = await response.json();
        balanceDisplay.textContent = `Balance: ${data.balance.toLocaleString()} coins`;
    } catch (error) {
        console.error('Error fetching balance:', error);
        balanceDisplay.textContent = 'Balance: Error loading';
    }
}
function updateBalanceDisplay(balance) {
    balanceDisplay.textContent = `Balance: ${balance.toLocaleString()} coins`;
}
export{updateBalance,updateBalanceDisplay};
document.addEventListener('DOMContentLoaded', () => {
        checkAdminStatus();
        updateBalance();
        // Get token more reliably
        function getAuthToken() {
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'auth_token') {
                    return value;
                }
            }
            return null;
        }
        
        const authToken = getAuthToken();
        //console.log('Auth token found:', authToken);
    
        if (!authToken) {
            window.location.href = '/login.html';
            return;  // Don't connect if no token
        }



    
    // Update balance immediately when page loads
    updateBalance();
    
    // Optional: Update balance periodically (every 30 seconds)
    setInterval(updateBalance, 30000);
    
    // Export function for use in other parts of your code
    window.updateBalance = updateBalance;

    // Debug cookie
    //console.log('Full cookie:', document.cookie);
    


    const socket = io('http://34.51.132.126:3000', {
    withCredentials: true,
    auth: {
        token: authToken
    }
});

    socket.on('connect', () => {
        //console.log('Connected to socket server');
        socket.emit('request_game_state');
    });

    socket.on('balance_update', (data) => {
        //console.log('Balance update received:', data);
        updateBalanceDisplay(data.balance);
    });







    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
    });


    window.dispatchEvent(new CustomEvent('socketReady', { detail: socket }));

    const chatbox = document.querySelector('.chatboxRow');
    const scroll = document.querySelector('.chatbox');
    const messageInput = document.getElementById('messageInput');
    
    // Debug logs to verify elements are found
    //console.log('Found chatbox:', chatbox);
    //console.log('Found messageInput:', messageInput);

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            // console.log('Key pressed:', e.key);  // Debug log
            if (e.key === 'Enter' && messageInput.value.trim()) {
                // console.log('Sending message:', messageInput.value);  // Debug log
                socket.emit('send_message', { message: messageInput.value });
                messageInput.value = '';
            }
        });
    } else {
        console.error('Message input element not found!');
    }

    function isCommand(message) {
        return message.startsWith('/');
    }

    // Function to create a message element
    function createMessageElement(messageData) {
        // Don't create element for command messages
        if (isCommand(messageData.message)) {
            return null;
        }        

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        const colImgDiv = document.createElement('div');
        colImgDiv.className = 'col-2 mt-3';
        const profilePicDiv = document.createElement('div');
        profilePicDiv.className = 'profile-pic mx-auto';
       
        const chatboxImg = document.createElement('img');
        //chatboxImg.className = ''
        chatboxImg.src = `http://34.51.132.126:3000/uploads/${messageData.profile_pic}`;
        chatboxImg.alt = 'Profile Picture';
        // Add error handling for images
        chatboxImg.onerror = function() {
            console.error(`Failed to load image for user: ${messageData.username}`);
            // Use correct path to default image
            this.src = 'http://34.51.132.126:3000/uploads/default.png';
        };

        colImgDiv.appendChild(profilePicDiv);
        profilePicDiv.appendChild(chatboxImg);

        // Modify username display based on admin status
        const usernameText = isAdmin ? 
            `${messageData.username} (${messageData.user_id}):` : 
            `${messageData.username}:`;

        messageDiv.innerHTML = `
            <div class="col-10 mt-3">
              <div id="chatUsername" class="">${usernameText}</div>
              <div id="chatMessage" class="ms-2 d-flex justify-content-start">${messageData.message}</div>
            </div>
        `;
        
        messageDiv.insertBefore(colImgDiv, messageDiv.firstChild);
        return messageDiv;
    }

    // Load initial messages
    socket.on('load_messages', (messages) => {
        chatbox.innerHTML = ''; // Clear existing messages
        messages.forEach(message => {
            const messageElement = createMessageElement(message);
            if (messageElement) { // Only append if not a command
                chatbox.appendChild(messageElement);
            }
        });
        scroll.scrollTop = chatbox.scrollHeight;
    });

    // Handle new messages
    socket.on('new_message', (message) => {
        const messageElement = createMessageElement(message);
        if (messageElement) { // Only append if not a command
            chatbox.appendChild(messageElement);
            scroll.scrollTop = chatbox.scrollHeight;
        }
    });

    // Handle command responses
    socket.on('commandResponse', (response) => {
        //console.log('Command response:', response.message);        
        // Optionally show a temporary notification or toast
        // You could add a small notification system here if you want admins
        // to see command confirmations
    });
    socket.on('error', (error) => {
        console.error('Server error:', error.message);
        // Optionally show error to user
        // You could add a small notification system here
    });

    // Handle sending messages
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && messageInput.value.trim()) {
            const message = messageInput.value.trim();
            //console.log('Sending message:', message);
           
            // Send the message regardless of whether it's a command
            socket.emit('send_message', { message: message });
           
            // Clear input
            messageInput.value = '';
           
            // If it's a command, don't worry about displaying it
            // The createMessageElement function will handle hiding it
        }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        // You might want to show an error message to the user
    });
});

const cssStyles = `
/* Mobile chat styles */
@media (max-width: 768px) {
  .mobilehide {
    display: none !important;
  }
  
  /* Chat toggle button styles - now on left side */
  .chat-toggle-btn {
    position: fixed;
    bottom: 20px;
    left: 20px; /* Left side positioning */
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #007bff;
    color: white;
    display: flex !important;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    border: none;
    cursor: pointer;
    transition: left 0.3s ease-in-out, transform 0.3s ease-in-out !important;
  }
  
  /* Button position when chat is open */
  .chat-toggle-btn.active {
    left: calc(85% - 30px) !important; /* Aligned with the right edge of chat */
    transform: rotate(45deg) !important; /* Transform to X */
  }
  
  /* Chat container when visible - slide from left with dark background */
  .mobile-chat-container {
    position: fixed !important;
    top: 0 !important;
    left: -100% !important; /* Start off-screen */
    height: 100vh !important;
    width: 85% !important;
    max-width: 350px !important;
    background: #424141 !important; /* Dark gray background */
    color: white !important; /* Light text for dark background */
    z-index: 9998 !important;
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3) !important;
    transition: left 0.3s ease-in-out !important;
    display: flex !important;
    flex-direction: column !important;
    overflow: hidden !important;
  }
  
  /* Chat container when active */
  .mobile-chat-container.active {
    left: 0 !important;
  }
  
  /* Chat content wrapper */
  .chat-content-wrapper {
    display: flex !important;
    flex-direction: column !important;
    height: 100% !important;
    width: 100% !important;
    padding: 10px !important;
    overflow: hidden !important;
    background: #424141 !important; /* Ensure the wrapper also has dark background */
  }
  
  /* Make sure chat elements are visible and properly styled */
  .chat-content-wrapper .chatboxRow,
  .chat-content-wrapper #chatboxRow {
    display: flex !important;
    flex-direction: column !important;
    visibility: visible !important;
    opacity: 1 !important;
    overflow-y: auto !important;
    flex-grow: 1 !important;
    background: #424141 !important; /* Dark background for messages area */
  }
  
  /* Style chat messages for dark theme */
  .chat-content-wrapper .message {
    background: #525252 !important; /* Slightly lighter than background */
    border-radius: 8px !important;
    margin-bottom: 8px !important;
    padding: 8px !important;
  }
  
  /* Style usernames for dark theme */
  .chat-content-wrapper #chatUsername {
    color: #f0f0f0 !important; /* Light color for usernames */
    font-weight: bold !important;
  }
  
  /* Style chat messages text for dark theme */
  .chat-content-wrapper #chatMessage {
    color: #e0e0e0 !important; /* Light gray for message text */
  }
  
  /* Message input container positioning */
  .chat-content-wrapper .messageInputContainer {
    margin-top: auto !important;
    padding: 10px 0 !important;
    background: #363636 !important; /* Darker than main background */
    border-top: 1px solid #525252 !important;
  }
  
  /* Style for input elements in dark theme */
  .chat-content-wrapper input,
  .chat-content-wrapper textarea {
    background: #525252 !important;
    border: 1px solid #626262 !important;
    color: white !important;
    border-radius: 4px !important;
    padding: 8px !important;
  }
}
`;

// Create and append the style element
const style = document.createElement('style');
style.textContent = cssStyles;
document.head.appendChild(style);

// Create mobile chat container that slides in from left
function createMobileChatInterface() {
  // Find the chat elements
  const chatbox = document.querySelector('.chatbox, #chatbox');
  const chatboxRow = document.querySelector('.chatboxRow, #chatboxRow');
  const messageInputContainer = document.querySelector('.messageInputContainer, #messageInputContainer');
  
  if (!chatbox || !chatboxRow) {
    console.error('Chat elements not found');
    return;
  }
  
  // Create container for mobile chat
  const mobileChatContainer = document.createElement('div');
  mobileChatContainer.className = 'mobile-chat-container';
  document.body.appendChild(mobileChatContainer);
  
  // Create content wrapper
  const chatContentWrapper = document.createElement('div');
  chatContentWrapper.className = 'chat-content-wrapper';
  mobileChatContainer.appendChild(chatContentWrapper);
  
  // Create toggle button with Font Awesome
  const toggleButton = document.createElement('button');
  toggleButton.className = 'chat-toggle-btn';
  toggleButton.innerHTML = '<i class="fas fa-comment"></i>';
  toggleButton.addEventListener('click', toggleMobileChat);
  document.body.appendChild(toggleButton);
  
  console.log('Mobile chat interface created');
  
  // Variable to track chat state
  let isChatOpen = false;
  
  // Clone the existing chat elements into our mobile container
  function updateChatContent() {
    // Clear previous content
    chatContentWrapper.innerHTML = '';
    
    // Clone the chatbox row (messages container)
    const clonedChatboxRow = chatboxRow.cloneNode(true);
    clonedChatboxRow.classList.remove('mobilehide');
    clonedChatboxRow.style.display = 'flex';
    chatContentWrapper.appendChild(clonedChatboxRow);
    
    // If there's a message input container, clone that too
    if (messageInputContainer) {
      const clonedInputContainer = messageInputContainer.cloneNode(true);
      clonedInputContainer.classList.remove('mobilehide');
      clonedInputContainer.style.display = 'block';
      chatContentWrapper.appendChild(clonedInputContainer);
      
      // Set up the input event listener in the cloned container
      const messageInput = clonedInputContainer.querySelector('input, textarea');
      if (messageInput) {
        // Remove existing event listeners by replacing the element
        const newMessageInput = messageInput.cloneNode(true);
        messageInput.parentNode.replaceChild(newMessageInput, messageInput);
        
        // Add new event listener
        newMessageInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && newMessageInput.value.trim()) {
            // Find the original input to submit the message
            const originalInput = document.querySelector('#messageInput');
            if (originalInput) {
              originalInput.value = newMessageInput.value;
              originalInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
              newMessageInput.value = '';
            }
          }
        });
      }
    }
    
    // Scroll to bottom of messages
    const messagesContainer = clonedChatboxRow;
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }
  
  // Function to toggle mobile chat open/closed
  function toggleMobileChat() {
    if (isChatOpen) {
      // Close the chat
      console.log('Closing mobile chat');
      mobileChatContainer.classList.remove('active');
      toggleButton.classList.remove('active');
    } else {
      // Open the chat
      console.log('Opening mobile chat');
      updateChatContent(); // Update with latest messages
      mobileChatContainer.classList.add('active');
      toggleButton.classList.add('active');
    }
    
    // Toggle state
    isChatOpen = !isChatOpen;
  }
  
  // Make these functions available if needed elsewhere
  window.toggleMobileChat = toggleMobileChat;
  
  // Handle screen size changes
  const mediaQuery = window.matchMedia('(min-width: 769px)');
  function handleScreenChange(e) {
    if (e.matches) {
      // Desktop view
      toggleButton.style.display = 'none';
      mobileChatContainer.style.display = 'none';
      isChatOpen = false;
    } else {
      // Mobile view
      toggleButton.style.display = 'flex';
      mobileChatContainer.style.display = 'flex';
      mobileChatContainer.classList.remove('active');
      toggleButton.classList.remove('active');
      isChatOpen = false;
    }
  }
  
  // Initial check
  handleScreenChange(mediaQuery);
  // Add listener for changes
  mediaQuery.addEventListener('change', handleScreenChange);
  
  // Set up a MutationObserver to watch for changes in the chat
  const chatObserver = new MutationObserver(function(mutations) {
    // Only update if the mobile chat is active
    if (isChatOpen) {
      updateChatContent();
    }
  });
  
  // Start observing the chat for changes
  chatObserver.observe(chatboxRow, { childList: true, subtree: true });
}

// Make sure DOM is fully loaded before running
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createMobileChatInterface);
} else {
  // DOM already loaded, run immediately
  createMobileChatInterface();
}


const $betAmountInput = $('#betAmount');
    let lastBetAmount = 0;
    function getCurrentBetAmount() {
        const currentAmount = parseInt($betAmountInput.val()) || 0;
        return Math.max(currentAmount, 0);
    }
    $('.buttons .button').on('click', function() {
        const buttonText = $(this).find('button').text();
        const currentAmount = getCurrentBetAmount();

        switch(buttonText) {
            case 'Clear':
                $betAmountInput.val('');
                break;
            case 'Last':
                $betAmountInput.val(lastBetAmount);
                break;
            case '100':
                $betAmountInput.val(currentAmount + 100);
                break;
            case '1000':
                $betAmountInput.val(currentAmount + 1000);
                break;
            case '1/2':
                $betAmountInput.val(Math.floor(currentAmount / 2));
                break;
            case 'x2':
                $betAmountInput.val(currentAmount * 2);
                break;
            case 'Max':
                // Make a fetch request to get the current balance
                fetch('http://34.51.132.126:3000/api/balance', {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' },
                        credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                        $betAmountInput.val(data.balance);
                })
                .catch(error => {
                        console.error('Error fetching balance for Max button:', error);
                        $betAmountInput.val(0);
                });
                break;            
        }

        // Store last bet amount for 'Last' button functionality
        if (buttonText !== 'Last' && buttonText !== 'Clear') {
            lastBetAmount = parseInt($betAmountInput.val()) || 0;
        }
    });
