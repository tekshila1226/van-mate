import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

let io;

export function initSocketIO(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    // Authentication middleware
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.user.role})`);
    
    // Join specific rooms based on role
    if (socket.user.role === 'driver') {
      socket.join(`driver:${socket.user._id}`);
    } else if (socket.user.role === 'parent') {
      socket.join(`parent:${socket.user._id}`);
    } else if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    // Handle client events
    socket.on('join:bus', (busId) => {
      socket.join(`bus:${busId}`);
    });

    socket.on('join:child', (childId) => {
      socket.join(`child:${childId}`);
    });

    socket.on('leave:bus', (busId) => {
      socket.leave(`bus:${busId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.firstName} ${socket.user.lastName}`);
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
}

export function emitBusLocationUpdate(busId, locationData) {
  if (!io) return;
  io.to(`bus:${busId}`).emit('bus:location_update', locationData);
}

export function emitStudentPickupEvent(busId, childId, eventData) {
  if (!io) return;
  io.to(`bus:${busId}`).emit('bus:student_pickup', eventData);
  io.to(`child:${childId}`).emit('child:pickup', eventData);
  io.to(`parent:${eventData.parentId}`).emit('parent:child_pickup', eventData);
}

export function emitStudentDropoffEvent(busId, childId, eventData) {
  if (!io) return;
  io.to(`bus:${busId}`).emit('bus:student_dropoff', eventData);
  io.to(`child:${childId}`).emit('child:dropoff', eventData);
  io.to(`parent:${eventData.parentId}`).emit('parent:child_dropoff', eventData);
}

export function emitEmergencyAlert(busId, alertData) {
  if (!io) return;
  io.to(`bus:${busId}`).emit('bus:emergency', alertData);
  io.to('admins').emit('admin:emergency', alertData);
  
  // Also emit to all parents with children on the bus
  if (alertData.affectedChildrenParents) {
    alertData.affectedChildrenParents.forEach(parentId => {
      io.to(`parent:${parentId}`).emit('parent:emergency', alertData);
    });
  }
}