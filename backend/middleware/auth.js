const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Priority: cookies first, then Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      token = req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : req.headers.authorization;
    }

    if (!token) {
      console.log("❌ No token found in cookies or headers");
      return res.status(401).json({ error: "No token provided" });
    }

    // Debug logging (REMOVE in production)
    console.log(
      "🔍 Verifying token with secret length:",
      process.env.JWT_SECRET?.length
    );

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("🔒 Auth middleware error:", {
      name: err.name,
      message: err.message,
      expired: err.name === "TokenExpiredError",
    });

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired, please login again" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = authMiddleware;
