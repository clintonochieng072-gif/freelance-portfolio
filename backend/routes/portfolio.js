const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");

// Get portfolio by username (Public route)
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const portfolio = await Portfolio.findOne({
      username: username.toLowerCase(),
      isPublished: true,
    });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// Get client's own portfolio (Protected)
router.get("/me/portfolio", authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ username: req.user.username });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(portfolio);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// Update portfolio (Client's own portfolio only)
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const {
      contacts,
      skills,
      projects,
      testimonials,
      displayName,
      title,
      bio,
      theme,
    } = req.body;

    let portfolio = await Portfolio.findOne({ username: req.user.username });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Update portfolio fields
    if (contacts) portfolio.contacts = contacts;
    if (skills) portfolio.skills = skills.filter((s) => s && s.trim() !== "");
    if (projects) portfolio.projects = projects;
    if (testimonials) portfolio.testimonials = testimonials;
    if (displayName) portfolio.displayName = displayName;
    if (title) portfolio.title = title;
    if (bio) portfolio.bio = bio;
    if (theme) portfolio.theme = theme;

    const savedPortfolio = await portfolio.save();

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(req.user.username).emit("portfolioUpdated", {
        username: req.user.username,
        portfolio: savedPortfolio,
      });
    }

    res.json({
      message: "Portfolio updated successfully",
      portfolio: savedPortfolio,
    });
  } catch (err) {
    console.error("Error updating portfolio:", err);
    res.status(500).json({ error: "Error updating portfolio" });
  }
});

module.exports = router;
