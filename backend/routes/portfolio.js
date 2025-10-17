const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");

// ✅ ROOT ROUTE - Get authenticated user's portfolio (matches frontend /api/portfolio)
router.get("/", authMiddleware, async (req, res) => {
  try {
    console.log(
      "📡 Fetching portfolio for authenticated user:",
      req.user.username
    );

    const portfolio = await Portfolio.findOne({
      username: req.user.username.toLowerCase(),
    });

    if (!portfolio) {
      return res.status(404).json({
        error: "Portfolio not found. Create one first.",
      });
    }

    console.log("✅ Portfolio found for:", req.user.username);
    res.json(portfolio);
  } catch (err) {
    console.error("Error fetching user portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// ✅ PUBLIC ROUTE - Get portfolio by username (no auth required)
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📡 Public fetch for username: ${username}`);

    // Validate username
    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length === 0
    ) {
      return res.status(400).json({ error: "Invalid username provided" });
    }

    const portfolio = await Portfolio.findOne({
      username: username.toLowerCase().trim(),
      isPublished: true,
    });

    if (!portfolio) {
      console.log(`❌ Portfolio not found or not published: ${username}`);
      return res.status(404).json({
        error: "Portfolio not found or is not published",
      });
    }

    // Ensure portfolio has safe default structure
    const safePortfolio = {
      ...portfolio.toObject(),
      contacts: portfolio.contacts || {},
      skills: portfolio.skills || [],
      projects: portfolio.projects || [],
      testimonials: portfolio.testimonials || [],
    };

    console.log(`✅ Public portfolio served: ${username}`);
    res.json(safePortfolio);
  } catch (err) {
    console.error("Error fetching public portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// ✅ Get client's own portfolio (Protected) - Keep for /api/portfolio/me/portfolio
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

// ✅ Update portfolio (Client's own portfolio only)
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
      isPublished, // Allow publishing/unpublishing
    } = req.body;

    let portfolio = await Portfolio.findOne({ username: req.user.username });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Update portfolio fields
    if (contacts !== undefined) portfolio.contacts = contacts || {};
    if (skills !== undefined)
      portfolio.skills = skills.filter((s) => s && s.trim() !== "");
    if (projects !== undefined) portfolio.projects = projects || [];
    if (testimonials !== undefined) portfolio.testimonials = testimonials || [];
    if (displayName !== undefined) portfolio.displayName = displayName;
    if (title !== undefined) portfolio.title = title;
    if (bio !== undefined) portfolio.bio = bio;
    if (theme !== undefined) portfolio.theme = theme;
    if (isPublished !== undefined) portfolio.isPublished = isPublished;

    const savedPortfolio = await portfolio.save();

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(req.user.username.toLowerCase()).emit("portfolioUpdated", {
        username: req.user.username,
        portfolio: savedPortfolio,
      });
      console.log(`📡 Emitted portfolio update for: ${req.user.username}`);
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
