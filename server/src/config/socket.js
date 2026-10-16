import { Server } from 'socket.io';

let io = null;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl || 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    // Hotel room subscription channel
    socket.on('join_hotel', (hotelId) => {
      if (hotelId) {
        socket.join(`hotel:${hotelId}`);
      }
    });

    socket.on('leave_hotel', (hotelId) => {
      if (hotelId) {
        socket.leave(`hotel:${hotelId}`);
      }
    });

    socket.on('disconnect', () => {
      // socket disconnected
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};
