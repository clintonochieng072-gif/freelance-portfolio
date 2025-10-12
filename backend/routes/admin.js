const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Portfolio = require("../models/Portfolio");

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

module.exports = router;
