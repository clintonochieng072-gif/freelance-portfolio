const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

/* =============================
   🧩 Helper: Token Generation
============================= */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/* =============================
   🧩 Register User
============================= */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
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

    // Create default portfolio for new user
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

    // Generate JWT
    const token = generateToken(user);

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

/* =============================
   🧩 Login User
============================= */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // ✅ Set cookie securely (works for dev + production)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

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

/* =============================
   🧩 Logout
============================= */
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

/* =============================
   🧩 Forgot Password
============================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal existence of the email
      return res.json({
        message: "If the email exists, a reset link has been sent",
      });
    }

    // Create reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { userId: user._id, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Reset link (frontend)
    const resetLink = `https://portfolio-frontend-clinton.onrender.com/reset-password?token=${resetToken}`;

    console.log(`Password reset link for ${email}: ${resetLink}`);

    res.json({
      message: "Password reset link has been generated",
      resetLink: resetLink, // For demo only — remove in production
      note: "In production, this link should be sent via email",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Error processing request" });
  }
});

/* =============================
   🧩 Reset Password
============================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    // Hash new password before saving
    user.password = await bcrypt.hash(newPassword, 10);
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

/* =============================
   🧩 Get Current User (/me)
============================= */
router.get("/me", async (req, res) => {
  try {
    let token = req.cookies?.token || req.headers["authorization"];

    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Strip "Bearer " prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Token verification failed:", err.message);
    res.status(401).json({
      error: "Invalid or expired token",
      details: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

module.exports = router;
