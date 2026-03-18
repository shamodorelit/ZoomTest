const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const httpServer = createServer();
const PORT = process.env.SIGNAL_PORT || 3001;

const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Track rooms: { [meetingId]: { [socketId]: { userId, userName, micOn, cameraOn, isAdmin, socketId } } }
const rooms = {};
// Track active screen sharer per room: { [meetingId]: socketId | null }
const screenSharers = {};
// Track screen share requests per room: { [meetingId]: [{ socketId, userId, userName }] }
const screenShareRequests = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // ─── JOIN ROOM ───────────────────────────────────────────────────
  socket.on('join-room', ({ meetingId, userId, userName, isAdmin }) => {
    socket.join(meetingId);

    if (!rooms[meetingId]) rooms[meetingId] = {};
    rooms[meetingId][socket.id] = { userId, userName, micOn: true, cameraOn: true, isAdmin, socketId: socket.id };

    // Notify existing participants about the new peer
    socket.to(meetingId).emit('user-joined', {
      socketId: socket.id, userId, userName, isAdmin,
      micOn: true, cameraOn: true,
    });

    // Send existing participants list to the new joiner
    const existingParticipants = Object.values(rooms[meetingId]).filter(p => p.socketId !== socket.id);
    socket.emit('existing-participants', existingParticipants);

    // Broadcast updated participant list to all
    io.to(meetingId).emit('participant-list', Object.values(rooms[meetingId]));

    console.log(`${userName} joined room ${meetingId}`);
  });

  // ─── WEBRTC SIGNALING ────────────────────────────────────────────
  socket.on('offer', ({ to, offer, from }) => {
    io.to(to).emit('offer', { from, offer });
  });

  socket.on('answer', ({ to, answer, from }) => {
    io.to(to).emit('answer', { from, answer });
  });

  socket.on('ice-candidate', ({ to, candidate, from }) => {
    io.to(to).emit('ice-candidate', { from, candidate });
  });

  // ─── MEDIA STATE ─────────────────────────────────────────────────
  socket.on('media-state', ({ meetingId, micOn, cameraOn }) => {
    if (rooms[meetingId] && rooms[meetingId][socket.id]) {
      rooms[meetingId][socket.id].micOn = micOn;
      rooms[meetingId][socket.id].cameraOn = cameraOn;
      io.to(meetingId).emit('participant-list', Object.values(rooms[meetingId]));
      socket.to(meetingId).emit('peer-media-state', { socketId: socket.id, micOn, cameraOn });
    }
  });

  // ─── SCREEN SHARE ─────────────────────────────────────────────────
  socket.on('request-screen-share', ({ meetingId, userId, userName }) => {
    if (!screenShareRequests[meetingId]) screenShareRequests[meetingId] = [];
    screenShareRequests[meetingId].push({ socketId: socket.id, userId, userName });

    // Notify admin
    Object.values(rooms[meetingId] || {}).forEach(p => {
      if (p.isAdmin) {
        io.to(p.socketId).emit('screen-share-request', { socketId: socket.id, userId, userName });
      }
    });
  });

  socket.on('approve-screen-share', ({ meetingId, targetSocketId }) => {
    const participant = rooms[meetingId]?.[socket.id];
    if (!participant?.isAdmin) return;

    // If someone is already sharing, stop them first
    if (screenSharers[meetingId]) {
      io.to(screenSharers[meetingId]).emit('screen-share-stopped');
    }

    screenSharers[meetingId] = targetSocketId;
    io.to(targetSocketId).emit('screen-share-approved');
    io.to(meetingId).emit('active-screen-sharer', { socketId: targetSocketId });
  });

  socket.on('deny-screen-share', ({ meetingId, targetSocketId }) => {
    io.to(targetSocketId).emit('screen-share-denied');
  });

  socket.on('start-screen-share', ({ meetingId }) => {
    screenSharers[meetingId] = socket.id;
    socket.to(meetingId).emit('active-screen-sharer', { socketId: socket.id });
  });

  socket.on('stop-screen-share', ({ meetingId }) => {
    if (screenSharers[meetingId] === socket.id) {
      screenSharers[meetingId] = null;
    }
    io.to(meetingId).emit('active-screen-sharer', { socketId: null });
  });

  // Admin force-stop screen share
  socket.on('admin-stop-screen-share', ({ meetingId }) => {
    const participant = rooms[meetingId]?.[socket.id];
    if (!participant?.isAdmin) return;

    if (screenSharers[meetingId]) {
      io.to(screenSharers[meetingId]).emit('screen-share-stopped');
    }
    screenSharers[meetingId] = null;
    io.to(meetingId).emit('active-screen-sharer', { socketId: null });
  });

  // ─── CHAT ──────────────────────────────────────────────────────────
  socket.on('send-message', ({ meetingId, message, senderName, senderId, timestamp }) => {
    io.to(meetingId).emit('new-message', { message, senderName, senderId, timestamp });
  });

  // ─── ADMIN MEDIA CONTROLS ──────────────────────────────────────────
  socket.on('admin-force-mute', ({ meetingId, targetSocketId }) => {
    const participant = rooms[meetingId]?.[socket.id];
    if (!participant?.isAdmin) return;
    io.to(targetSocketId).emit('force-mute');
  });

  socket.on('admin-toggle-camera', ({ meetingId, targetSocketId }) => {
    const participant = rooms[meetingId]?.[socket.id];
    if (!participant?.isAdmin) return;
    io.to(targetSocketId).emit('force-toggle-camera');
  });

  // ─── END MEETING (Admin) ──────────────────────────────────────────
  socket.on('end-meeting', ({ meetingId }) => {
    const participant = rooms[meetingId]?.[socket.id];
    if (!participant?.isAdmin) return;

    io.to(meetingId).emit('meeting-ended');
    delete rooms[meetingId];
    delete screenSharers[meetingId];
    delete screenShareRequests[meetingId];
  });

  // ─── DISCONNECT ────────────────────────────────────────────────────
  socket.on('disconnecting', () => {
    socket.rooms.forEach(meetingId => {
      if (meetingId === socket.id) return;

      if (rooms[meetingId]) {
        const participant = rooms[meetingId][socket.id];
        delete rooms[meetingId][socket.id];

        socket.to(meetingId).emit('user-left', { socketId: socket.id });
        io.to(meetingId).emit('participant-list', Object.values(rooms[meetingId]));

        if (screenSharers[meetingId] === socket.id) {
          screenSharers[meetingId] = null;
          io.to(meetingId).emit('active-screen-sharer', { socketId: null });
        }
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`);
});
