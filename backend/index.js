require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);

// ✅ Updated CORS setup using environment variable
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio SaaS Backend is running",
    version: "1.0.0",
  });
});

// API root route
app.get("/api", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio SaaS API is running",
    endpoints: {
      auth: "/api/auth",
      portfolio: "/api/portfolio",
      admin: "/api/admin",
    },
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio API is working",
    timestamp: new Date().toISOString(),
  });
});

// Socket.io with updated CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinPortfolioRoom", (username) => {
    socket.join(username);
    console.log(`Socket ${socket.id} joined room: ${username}`);
  });

  socket.on("portfolioUpdated", (data) => {
    const username = data.username;
    io.to(username).emit("portfolioUpdated", data);
    console.log(`Portfolio updated for: ${username}`);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Atlas connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Multi-tenant portfolio SaaS running on port ${PORT}`);
  console.log(`Available routes:`);
  console.log(`- GET  /api/health`);
  console.log(`- GET  /api/auth/*`);
  console.log(`- GET  /api/portfolio/*`);
  console.log(`- GET  /api/admin/*`);
});
