require("dotenv").config(); // ✅ Load env vars FIRST
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

// 🔑 DEBUG: Verify critical environment variables are loaded
console.log("🚀 Server starting with:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "NOT SET");
console.log("- JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("- JWT_SECRET length:", process.env.JWT_SECRET?.length);
console.log("- MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);

// ✅ Build allowed origins array with dynamic FRONTEND_URL
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // Create React App dev
  process.env.FRONTEND_URL || "https://portfolio-frontend-clinton.onrender.com",
  "https://portfolio-frontend-clinton.onrender.com", // Fallback
]
  .filter(Boolean)
  .filter((origin, index, self) => self.indexOf(origin) === index); // Remove duplicates

console.log("✅ Allowed origins:", allowedOrigins);

// ✅ COMPREHENSIVE CORS with credentials support
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) {
        console.log("🌐 Allowing request with no origin");
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        console.log("✅ CORS allowed:", origin);
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked:", origin);
        console.warn("Allowed origins:", allowedOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ CRITICAL for cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"], // Allow frontend to see cookies
  })
);

// ✅ Essential Middlewares
app.use(express.json({ limit: "10mb" })); // Handle larger payloads
app.use(cookieParser()); // ✅ Required for httpOnly cookies

// ✅ Request logging middleware with token presence
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const origin = req.headers.origin || "direct";

  console.log(`${timestamp} - ${method} ${path} - Origin: ${origin}`);

  // Log token presence for debugging (remove in production)
  if (req.cookies?.token) {
    console.log("🍪 Token cookie present");
  } else if (req.headers.authorization) {
    console.log("🔑 Authorization header present");
  }

  next();
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Health and root routes
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio SaaS Backend is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    allowedOrigins,
  });
});

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

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio API is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    jwtSecretLoaded: !!process.env.JWT_SECRET,
  });
});

// ✅ Socket.io with Render-friendly configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Render-friendly Socket.IO settings
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["polling", "websocket"], // Support both
  allowEIO3: true, // Support older clients
});

app.set("io", io);

// ✅ Enhanced Socket connection handler
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);

  // Handle room joining with error checking
  socket.on("joinPortfolioRoom", (username) => {
    try {
      if (username && typeof username === "string") {
        const roomName = username.toLowerCase().trim();
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);

        // Confirm join to client
        socket.emit("roomJoined", { room: roomName });
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  });

  // Handle portfolio updates
  socket.on("portfolioUpdated", (data) => {
    try {
      const username = data?.username;
      if (username && data?.portfolio) {
        const roomName = username.toLowerCase().trim();
        io.to(roomName).emit("portfolioUpdated", {
          username: username,
          portfolio: data.portfolio,
        });
        console.log(`📊 Portfolio updated for room: ${roomName}`);
      }
    } catch (error) {
      console.error("Error broadcasting portfolio update:", error);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });

  // Handle connection errors
  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// ✅ MongoDB Connection with better error handling
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.error("MONGODB_URI check:", !!process.env.MONGODB_URI);
    process.exit(1); // Exit if DB connection fails
  });

// ✅ Enhanced Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed",
      yourOrigin: req.headers.origin,
      allowedOrigins,
    });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong!"
        : err.message,
  });
});

// ✅ 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// ✅ Start Server with proper PORT handling
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  // Bind to all interfaces for Render
  console.log(`🚀 Multi-tenant portfolio SaaS running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log(`📍 Available routes:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/portfolio/*`);
  console.log(`   - GET  /api/admin/*`);
  console.log(`🔌 Socket.io enabled with polling fallback`);

  if (process.env.NODE_ENV !== "production") {
    console.log(`🔑 JWT_SECRET length: ${process.env.JWT_SECRET?.length}`);
  }
});

// ✅ Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed");
      process.exit(0);
    });
  });
});
