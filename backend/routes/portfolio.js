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

    // Compute introduction dynamically
    const introduction =
      portfolio.displayName && portfolio.occupation
        ? `Hi, I'm ${portfolio.displayName} — ${portfolio.occupation}`
        : "Welcome to my portfolio!";

    console.log("✅ Portfolio found for:", req.user.username);
    res.json({ ...portfolio.toObject(), introduction });
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

    // Compute introduction dynamically
    const introduction =
      portfolio.displayName && portfolio.occupation
        ? `Hi, I'm ${portfolio.displayName} — ${portfolio.occupation}`
        : "Welcome to my portfolio!";

    // Ensure portfolio has safe default structure
    const safePortfolio = {
      ...portfolio.toObject(),
      introduction,
      contacts: portfolio.contacts || {},
      skills: portfolio.skills || [],
      projects: portfolio.projects || [],
      testimonials: portfolio.testimonials || [],
      about: portfolio.about || "",
      profilePicture: portfolio.profilePicture || "",
      resumeUrl: portfolio.resumeUrl || "",
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

    // Compute introduction dynamically
    const introduction =
      portfolio.displayName && portfolio.occupation
        ? `Hi, I'm ${portfolio.displayName} — ${portfolio.occupation}`
        : "Welcome to my portfolio!";

    res.json({ ...portfolio.toObject(), introduction });
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
      isPublished,
      occupation, // New field
      about, // New field
      profilePicture, // New field
      resumeUrl, // New field
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
    if (occupation !== undefined) portfolio.occupation = occupation || "";
    if (about !== undefined) portfolio.about = about || "";
    if (profilePicture !== undefined)
      portfolio.profilePicture = profilePicture || "";
    if (resumeUrl !== undefined) portfolio.resumeUrl = resumeUrl || "";

    const savedPortfolio = await portfolio.save();

    // Compute introduction for response
    const introduction =
      savedPortfolio.displayName && savedPortfolio.occupation
        ? `Hi, I'm ${savedPortfolio.displayName} — ${savedPortfolio.occupation}`
        : "Welcome to my portfolio!";

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(req.user.username.toLowerCase()).emit("portfolioUpdated", {
        username: req.user.username,
        portfolio: { ...savedPortfolio.toObject(), introduction },
      });
      console.log(`📡 Emitted portfolio update for: ${req.user.username}`);
    }

    res.json({
      message: "Portfolio updated successfully",
      portfolio: { ...savedPortfolio.toObject(), introduction },
    });
  } catch (err) {
    console.error("Error updating portfolio:", err);
    res.status(500).json({ error: "Error updating portfolio" });
  }
});

// Placeholder image upload endpoint (replace with real storage service)
router.post("/upload-image", authMiddleware, async (req, res) => {
  try {
    // For now, return placeholder URL - replace with actual upload logic
    const imageUrl =
      req.body.imageUrl ||
      "https://via.placeholder.com/150x150/007bff/ffffff?text=Profile";
    console.log(`📤 Image upload requested for user: ${req.user.username}`);
    res.json({ imageUrl });
  } catch (err) {
    console.error("Error handling image upload:", err);
    res.status(500).json({ error: "Error uploading image" });
  }
});

module.exports = router;
