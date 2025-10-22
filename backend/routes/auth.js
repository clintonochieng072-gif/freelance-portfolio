const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // ADD THIS LINE
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

// Cache for frequently accessed data
const userCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Clear cache periodically
setInterval(() => {
  userCache.clear();
}, CACHE_TTL);

router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Quick validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    })
      .select("_id")
      .lean();

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
    });
    await user.save();

    const portfolio = new Portfolio({
      username: username.toLowerCase(),
      userId: user._id,
      displayName: displayName || username,
    });
    await portfolio.save();

    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Cache user data
    userCache.set(user._id.toString(), {
      id: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Find user with only necessary fields
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("username email password plan status lastLogin")
      .lean();

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status !== "active") {
      return res.status(401).json({ error: "Account not active" });
    }

    const token = generateToken(user);

    // Update last login without fetching full user
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Cache user data
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
    };
    userCache.set(user._id.toString(), userData);

    res.json({
      message: "Login successful",
      user: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ message: "Logged out successfully" });
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    // Try cache first
    const cachedUser = userCache.get(req.user.userId);
    if (cachedUser) {
      return res.json({ user: cachedUser });
    }

    // If not cached, get fresh data with minimal fields
    const user = await User.findById(req.user.userId)
      .select("username email plan status customDomain createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      plan: user.plan,
      status: user.status,
      customDomain: user.customDomain,
      createdAt: user.createdAt,
    };

    // Cache the result
    userCache.set(req.user.userId, userData);

    res.json({ user: userData });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// Keep endpoints for password reset (unchanged)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() })
      .select("_id")
      .lean();

    if (!user) {
      return res.json({ message: "If email exists, reset link sent" });
    }

    const resetToken = jwt.sign(
      { userId: user._id, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Password reset link generated", resetToken });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    user.password = newPassword;
    await user.save();

    // Clear cache
    userCache.delete(user._id.toString());

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
