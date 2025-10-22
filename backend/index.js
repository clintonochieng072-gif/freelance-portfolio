require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const compression = require("compression");

const authRoutes = require("./routes/auth");
const portfolioRoutes = require("./routes/portfolio");
const adminRoutes = require("./routes/admin");

const app = express();
const server = http.createServer(app);

console.log("🚀 Server starting with:");
console.log("- NODE_ENV:", process.env.NODE_ENV || "NOT SET");
console.log("- JWT_SECRET exists:", !!process.env.JWT_SECRET);
console.log("- JWT_SECRET length:", process.env.JWT_SECRET?.length);
console.log("- MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("- FRONTEND_URL:", process.env.FRONTEND_URL);
console.log(
  "- CLOUDINARY_CLOUD_NAME:",
  process.env.CLOUDINARY_CLOUD_NAME || "NOT SET"
);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL || "https://portfolio-frontend-clinton.onrender.com",
  "https://portfolio-frontend-clinton.onrender.com",
]
  .filter(Boolean)
  .filter((origin, index, self) => self.indexOf(origin) === index);

console.log("✅ Allowed origins:", allowedOrigins);

// Compression middleware for faster responses
app.use(compression());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        if (process.env.NODE_ENV !== "production") {
          console.log("🌐 Allowing request with no origin");
        }
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        if (process.env.NODE_ENV !== "production") {
          console.log("✅ CORS allowed:", origin);
        }
        callback(null, true);
      } else {
        console.warn("❌ CORS blocked:", origin);
        console.warn("Allowed origins:", allowedOrigins);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const origin = req.headers.origin || "direct";

  if (process.env.NODE_ENV !== "production") {
    console.log(`${timestamp} - ${method} ${path} - Origin: ${origin}`);
  }

  if (req.cookies?.token) {
    if (process.env.NODE_ENV !== "production") {
      console.log("🍪 Token cookie present");
    }
  } else if (req.headers.authorization) {
    if (process.env.NODE_ENV !== "production") {
      console.log("🔑 Authorization header present");
    }
  }
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio SaaS Backend is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    allowedOrigins,
    features: {
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
      compression: true,
      caching: true,
    },
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
    health: "/api/health",
    fast_health: "/api/health/fast",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Portfolio API is working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    jwtSecretLoaded: !!process.env.JWT_SECRET,
    cloudinaryConfigured: !!process.env.CLOUDINARY_CLOUD_NAME,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Fast health check endpoint for load balancers
app.get("/api/health/fast", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["polling", "websocket"],
  allowEIO3: true,
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id);
  socket.on("joinPortfolioRoom", (username) => {
    try {
      if (username && typeof username === "string") {
        const roomName = username.toLowerCase().trim();
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
        socket.emit("roomJoined", { room: roomName });
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  });

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

  socket.on("error", (error) => {
    console.error(`Socket ${socket.id} error:`, error);
  });
});

// OPTIMIZED MONGODB CONNECTION - REMOVED INDEX CREATION THAT CAUSED CRASH
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 1,
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected successfully");
    console.log(
      "📊 Database indexes will be created automatically on first use"
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    console.error("MONGODB_URI check:", !!process.env.MONGODB_URI);
    process.exit(1);
  });

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

app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Multi-tenant portfolio SaaS running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log(`📍 Available routes:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - GET  /api/health/fast (optimized)`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/portfolio/*`);
  console.log(`   - GET  /api/admin/*`);
  console.log(`🔌 Socket.io enabled with polling fallback`);
  console.log(
    `📁 Cloudinary: ${
      process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configured" : "❌ Not configured"
    }`
  );
  console.log(`⚡ Performance: Compression enabled, Caching active`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🔑 JWT_SECRET length: ${process.env.JWT_SECRET?.length}`);
  }
});

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
