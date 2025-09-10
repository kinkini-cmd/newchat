let socket = io();
let username = '';
let currentRoom = 'General';
let roomMessages = {};

// Set username and show chat
function setUsername() {
  const input = document.getElementById('username-input');
  const name = input.value.trim();
  if (!name) return alert('Enter a username!');

  username = name;
  document.getElementById('display-username').textContent = username;

  // Hide username form and show chat container
  document.getElementById('username-form').style.display = 'none';
  document.querySelector('.chat-container-wrapper').style.display = 'block';

  // Notify server about new user
  socket.emit('new_user', { username });

  // Join default room
  joinRoom('General');
  highlightActiveRoom('General');
}

// Socket events
socket.on('message', (data) => {
  addMessage(data.username, data.msg, data.username === username ? 'user' : 'other');
});

socket.on('private_message', (data) => {
  addMessage(data.from, `[Private] ${data.msg}`, 'private');
});

socket.on('status', (data) => {
  addMessage('System', data.msg, 'system');
});

socket.on('active_users', (data) => {
  const userList = document.getElementById('active-users');
  userList.innerHTML = data.users
    .map(
      user => `<div class="user-item" onclick="insertPrivateMessage('${user}')">
                ${user} ${user === username ? '(you)' : ''}
               </div>`
    ).join('');
});

// Add a message to chat
function addMessage(sender, message, type) {
  if (!roomMessages[currentRoom]) roomMessages[currentRoom] = [];
  roomMessages[currentRoom].push({ sender, message, type });

  const chat = document.getElementById('chat');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', type);

  messageDiv.innerHTML = `<span class="username">${sender}</span><p>${message}</p>`;

  chat.appendChild(messageDiv);
  chat.scrollTop = chat.scrollHeight;
}

// Send message
function sendMessage() {
  if (!username) return alert('Please enter your username first!');
  const input = document.getElementById('message');
  const msg = input.value.trim();
  if (!msg) return;

  if (msg.startsWith('@')) {
    const [target, ...msgParts] = msg.substring(1).split(' ');
    const privateMsg = msgParts.join(' ');
    if (privateMsg) {
      socket.emit('private_message', { target, msg: privateMsg });
    }
  } else {
    socket.emit('message', { room: currentRoom, msg });
  }

  input.value = '';
}

// Join room
function joinRoom(room) {
  socket.emit('leave', { room: currentRoom });
  currentRoom = room;
  socket.emit('join', { room });

  highlightActiveRoom(room);

  // Show room history
  const chat = document.getElementById('chat');
  chat.innerHTML = '';
  if (roomMessages[room]) {
    roomMessages[room].forEach(msg => addMessage(msg.sender, msg.message, msg.type));
  }
}

// Prefill message input for private message
function insertPrivateMessage(user) {
  const input = document.getElementById('message');
  input.value = `@${user} `;
  input.focus();
}

// Handle Enter key
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}

// Highlight active room
function highlightActiveRoom(room) {
  document.querySelectorAll('.room-item').forEach(item => {
    item.classList.remove('active-room');
    if (item.textContent.trim() === room) item.classList.add('active-room');
  });
}
