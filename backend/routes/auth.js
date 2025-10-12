const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

// Client Registration
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email or username already exists",
      });
    }

    // Create user
    const user = new User({ username, email, password });
    await user.save();

    // Create default portfolio
    const portfolio = new Portfolio({
      username,
      userId: user._id,
      displayName: displayName || username,
      contacts: {},
      skills: [],
      projects: [],
      testimonials: [],
    });
    await portfolio.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
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

// Client Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Forgot password - send reset link
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // For demo purposes, return the reset link
    // In production, send this via email
    const resetLink = `https://portfolio-frontend-clinton.onrender.com/reset-password?token=${resetToken}`;

    console.log(`Password reset link for ${email}: ${resetLink}`);

    res.json({
      message: "Password reset link has been generated",
      resetLink: resetLink, // Remove this in production - just for demo
      note: "In production, this link would be sent via email",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's a password reset token
    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message:
        "Password reset successfully. You can now login with your new password.",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ error: "Invalid or expired reset token" });
  }
});

// Get current user
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.token || req.headers["authorization"];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
