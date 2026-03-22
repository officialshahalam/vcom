import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import env from "../config/env";
import registerSocketEvents from "./socket.events";

export function createSocketServer(httpServer: HttpServer): Server {
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
