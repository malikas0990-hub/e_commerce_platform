const { Server } = require('socket.io');
const logger = require('./utils/logger');

let io = null;

// Initialise Socket.IO on an existing HTTP server. Called once from server.js.
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on('disconnect', () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  return io;
}

// Safe accessor used by routes — never throws even before init.
function getIO() {
  return io || { emit: () => {} };
}

module.exports = { initSocket, getIO };
