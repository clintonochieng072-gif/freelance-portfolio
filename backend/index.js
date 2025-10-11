require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");

const app = express();
const server = http.createServer(app);

// ---- CORS setup ----
const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ---- Middlewares ----
app.use(express.json());
app.use(cookieParser());

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);

// ---- Socket.io ----
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ FIX: Make io instance accessible to routes
app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinPortfolioRoom", (username) => {
    socket.join(username);
  });

  socket.on("portfolioUpdated", (data) => {
    const username = data.username;
    io.to(username).emit("portfolioUpdated", data);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// ---- MongoDB connection ----
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ---- Start server ----
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
