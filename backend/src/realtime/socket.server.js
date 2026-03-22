const { Server } = require("socket.io");
const env = require("../config/env");
const registerSocketEvents = require("./socket.events");

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    registerSocketEvents(io, socket);
  });

  return io;
}

module.exports = {
  createSocketServer,
};
