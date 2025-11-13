require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Models Import

const Message = require('./models/Message');

const app = express();

// --- CORS SETUP (Fix for connection refused) ---
app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json({ limiy: '10mb' }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Connection Error: ", err));


app.use('/api/auth', require('./routes/auth'));


app.use('/api/messages', require('./routes/message'));

// --- Socket.IO ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join_room', (data) => {
    socket.join(data);
    console.log(`User ${socket.id} joined room: ${data}`);
  });

  socket.on('typing', (data) => {
    socket.to(data.room).emit('display_typing', data.username);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.room).emit('display_typing', data.username);
  });

  socket.on('send_message', async (data) => {
    try {
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        image: data.image,
        time: data.time
      });
      await newMessage.save();

      io.to(data.room).emit('receive_message', data);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});