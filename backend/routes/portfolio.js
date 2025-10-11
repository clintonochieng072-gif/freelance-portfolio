// routes/portfolio.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");

// GET portfolio by username
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    let portfolio = await Portfolio.findOne({ username });

    if (!portfolio) {
      portfolio = new Portfolio({
        username,
        contacts: {},
        skills: [],
        projects: [],
        testimonials: [],
      });
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// Update portfolio (admin only)
router.put("/update/:username", authMiddleware, async (req, res) => {
  const { username } = req.params;
  const { contacts, skills, projects, testimonials } = req.body;

  try {
    let portfolio = await Portfolio.findOne({ username });

    if (!portfolio) {
      portfolio = new Portfolio({
        username,
        contacts: {},
        skills: [],
        projects: [],
        testimonials: [],
      });
    }

    // Update only provided fields
    if (contacts) {
      const cleanContacts = {};
      Object.keys(contacts).forEach((key) => {
        if (contacts[key] && contacts[key].trim() !== "") {
          cleanContacts[key] = contacts[key];
        }
      });
      portfolio.contacts = cleanContacts;
    }

    if (skills) {
      portfolio.skills = skills.filter((s) => s && s.trim() !== "");
    }

    if (projects) {
      portfolio.projects = projects.map((p, index) => ({
        id: p.id || Date.now() + index,
        name: p.name || "",
        description: p.description || "",
        github: p.github || "",
        liveDemo: p.liveDemo || "",
      }));
    }

    // ✅ UPDATE Testimonials with profile picture
    if (testimonials) {
      portfolio.testimonials = testimonials.map((t, index) => ({
        id: t.id || Date.now() + index,
        clientName: t.clientName || "",
        comment: t.comment || "",
        position: t.position || "",
        company: t.company || "",
        profilePicture: t.profilePicture || "", // ✅ ADD profile picture
      }));
    }

    const savedPortfolio = await portfolio.save();

    // Emit socket event immediately for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(username).emit("portfolioUpdated", {
        username: username,
        contacts: savedPortfolio.contacts,
        skills: savedPortfolio.skills,
        projects: savedPortfolio.projects,
        testimonials: savedPortfolio.testimonials,
      });
    }

    res.json({
      message: "Saved",
      portfolio: savedPortfolio,
    });
  } catch (err) {
    console.error("Error updating portfolio:", err);
    res.status(500).json({ error: "Error updating portfolio: " + err.message });
  }
});

module.exports = router;
