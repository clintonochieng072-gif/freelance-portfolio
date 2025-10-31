const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

// Middleware to check if user is admin
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("email");
    if (user.email !== "clintonochieng072@gmail.com") {
      return res.status(403).json({ error: "Access denied. Admin only." });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ error: "Error checking admin status" });
  }
};

// Get client dashboard data
router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ username: req.user.username });
    const user = await User.findById(req.user.userId).select("-password");

    res.json({
      user,
      portfolio,
      stats: {
        projectsCount: portfolio?.projects?.length || 0,
        skillsCount: portfolio?.skills?.length || 0,
        testimonialsCount: portfolio?.testimonials?.length || 0,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Error fetching dashboard data" });
  }
});

// Update client profile
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { displayName, email } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already exists" });
      }
      user.email = email;
    }

    await user.save();

    // Update portfolio display name if provided
    if (displayName) {
      await Portfolio.updateOne(
        { username: req.user.username },
        { displayName }
      );
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ error: "Error updating profile" });
  }
});

// Search user by email (admin only)
router.get(
  "/search-user",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ error: "Email parameter required" });
      }

      const user = await User.findOne({ email: email.toLowerCase() })
        .select("username email has_paid is_first_login createdAt")
        .lean();

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user._id,
          name: user.username,
          email: user.email,
          has_paid: user.has_paid,
          is_first_login: user.is_first_login,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      console.error("User search error:", err);
      res.status(500).json({ error: "Error searching user" });
    }
  }
);

// Confirm payment for user (admin only)
router.put(
  "/confirm-payment/:userId",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.has_paid = true;
      await user.save();

      res.json({
        message: "Payment confirmed successfully",
        user: {
          id: user._id,
          name: user.username,
          email: user.email,
          has_paid: user.has_paid,
        },
      });
    } catch (err) {
      console.error("Payment confirmation error:", err);
      res.status(500).json({ error: "Error confirming payment" });
    }
  }
);

module.exports = router;
