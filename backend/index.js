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

// ✅ FIXED: Proper CORS configuration with multiple allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://portfolio-frontend-clinton.onrender.com",
  process.env.FRONTEND_URL, // Optional: for additional environments
].filter(Boolean); // Remove any undefined values

// ✅ FIXED: Single, comprehensive CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// ✅ REMOVED: Duplicate app.options() calls - the cors middleware handles OPTIONS automatically

// Middlewares
app.use(express.json());
app.use(cookieParser());

// ✅ ADDED: Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${
      req.headers.origin
    }`
  );
  next();
});

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
    allowedOrigins: allowedOrigins,
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
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ FIXED: Socket.io with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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

// ✅ ADDED: Global error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed",
      yourOrigin: req.headers.origin,
      allowedOrigins: allowedOrigins,
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Multi-tenant portfolio SaaS running on port ${PORT}`);
  console.log(`Allowed origins:`, allowedOrigins);
  console.log(`Available routes:`);
  console.log(`- GET  /api/health`);
  console.log(`- GET  /api/auth/*`);
  console.log(`- GET  /api/portfolio/*`);
  console.log(`- GET  /api/admin/*`);
});
