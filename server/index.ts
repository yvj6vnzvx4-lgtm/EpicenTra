import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", connections: io.engine.clientsCount });
});

// Track presence per event room
function getRoomPresence(eventId: string): string[] {
  const room = io.sockets.adapter.rooms.get(eventId);
  if (!room) return [];
  const names: string[] = [];
  for (const socketId of room) {
    const s = io.sockets.sockets.get(socketId);
    if (s?.data.userName) names.push(s.data.userName);
  }
  return names;
}

io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Join an event room
  socket.on("join-event", ({ eventId, userName }: { eventId: string; userName: string }) => {
    socket.join(eventId);
    socket.data.eventId = eventId;
    socket.data.userName = userName;
    console.log(`[socket] ${userName} joined event ${eventId}`);

    // Tell everyone in the room (including sender) who's online
    io.to(eventId).emit("presence-update", getRoomPresence(eventId));
  });

  // Leave event room
  socket.on("leave-event", ({ eventId }: { eventId: string }) => {
    socket.leave(eventId);
    io.to(eventId).emit("presence-update", getRoomPresence(eventId));
  });

  // Broadcast a new note to everyone else in the room
  socket.on("broadcast-note", ({ eventId, note }: { eventId: string; note: unknown }) => {
    socket.to(eventId).emit("new-note", note);
  });

  // Typing indicators
  socket.on("typing-start", ({ eventId }: { eventId: string }) => {
    socket.to(eventId).emit("user-typing", { userName: socket.data.userName });
  });

  socket.on("typing-stop", ({ eventId }: { eventId: string }) => {
    socket.to(eventId).emit("user-stopped-typing", { userName: socket.data.userName });
  });

  // Note pinned/updated
  socket.on("note-updated", ({ eventId, note }: { eventId: string; note: unknown }) => {
    socket.to(eventId).emit("note-updated", note);
  });

  socket.on("disconnect", () => {
    const eventId = socket.data.eventId;
    if (eventId) {
      io.to(eventId).emit("presence-update", getRoomPresence(eventId));
    }
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`[socket] server running on port ${PORT}`);
});
