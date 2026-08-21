import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;
const userSockets = new Map<string, string>(); // userId -> socketId
const roleRooms = new Map<string, Set<string>>(); // role -> Set of socketIds

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user
    socket.on('register', (data: { userId: string; role: string }) => {
      const { userId, role } = data;
      if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`Registered user ${userId} to socket ${socket.id}`);
      }

      if (role) {
        socket.join(role);
        console.log(`Socket ${socket.id} joined role room: ${role}`);
      }
    });

    // Join room (e.g., chat request ID)
    socket.on('join_room', (roomName: string) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined room: ${roomName}`);
    });

    socket.on('leave_room', (roomName: string) => {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left room: ${roomName}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Clean up maps
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

// Global emission helpers
export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(role).emit(event, data);
  }
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    const socketId = userSockets.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
    }
  }
};

export const emitToRoom = (roomName: string, event: string, data: any) => {
  if (io) {
    io.to(roomName).emit(event, data);
  }
};
