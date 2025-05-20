import { io } from "socket.io-client";

let socket;

// Initialize the socket connection
export function initializeSocket(token) {
  if (socket) return socket;
  
  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
    auth: { token },
    autoConnect: true
  });
  
  socket.on('connect', () => {
    console.log('Socket connected!');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected!');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });
  
  return socket;
}

// Get the socket instance
export function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized. Call initializeSocket first.');
  }
  return socket;
}

// Join a bus tracking room
export function joinBusTracking(busId) {
  if (!socket) return;
  socket.emit('join:bus', busId);
}

// Leave a bus tracking room
export function leaveBusTracking(busId) {
  if (!socket) return;
  socket.emit('leave:bus', busId);
}

// Join a child tracking room
export function joinChildTracking(childId) {
  if (!socket) return;
  socket.emit('join:child', childId);
}

// Clean up socket connection
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}