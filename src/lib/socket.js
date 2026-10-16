import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (typeof window === 'undefined') {
    return null; // Return null on server-side rendering
  }

  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });
  }

  return socketInstance;
};

export const socket = typeof window !== 'undefined' ? getSocket() : null;
export default socket;
