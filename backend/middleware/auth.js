const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Cache for auth tokens
const authCache = new Map();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : req.headers.authorization;
    }

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Check cache first
    const cachedAuth = authCache.get(token);
    if (cachedAuth) {
      req.user = cachedAuth;
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get minimal user data
    const user = await User.findById(decoded.userId)
      .select("username plan status")
      .lean();

    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userData = {
      userId: user._id.toString(),
      username: user.username,
      plan: user.plan,
    };

    // Cache for faster subsequent requests
    authCache.set(token, userData);
    setTimeout(() => authCache.delete(token), AUTH_CACHE_TTL);

    req.user = userData;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
};

// Clear expired cache entries periodically
setInterval(() => {
  authCache.clear();
}, AUTH_CACHE_TTL);

module.exports = authMiddleware;
