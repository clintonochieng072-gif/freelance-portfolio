const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const Portfolio = require("../models/Portfolio");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "di4kkzjma",
  api_key: process.env.CLOUDINARY_API_KEY || "181156621679153",
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for temporary file storage
const storage = multer.memoryStorage(); // Store files in memory temporarily
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).fields([
  { name: "profilePicture", maxCount: 1 },
  { name: "resumeFile", maxCount: 1 },
]);

// Upload to Cloudinary function
const uploadToCloudinary = async (file, folder, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `portfolio_uploads/${folder}`,
        resource_type: resourceType,
        upload_preset: "portfolio_uploads",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

// ROOT ROUTE - Get authenticated user's portfolio
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
    res.json(portfolio.toObject());
  } catch (err) {
    console.error("Error fetching user portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// PUBLIC ROUTE - Get portfolio by username (no auth required)
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`📡 Public fetch for username: ${username}`);

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

    const safePortfolio = {
      ...portfolio.toObject(),
      contacts: portfolio.contacts || {},
      skills: portfolio.skills || [],
      projects: portfolio.projects || [],
      testimonials: portfolio.testimonials || [],
      bio: portfolio.bio || "",
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

// Get client's own portfolio (Protected)
router.get("/me/portfolio", authMiddleware, async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ username: req.user.username });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    res.json(portfolio.toObject());
  } catch (err) {
    console.error("Error fetching portfolio:", err);
    res.status(500).json({ error: "Error fetching portfolio" });
  }
});

// Update portfolio (Client's own portfolio only) - UPDATED FOR CLOUDINARY
router.put("/update", authMiddleware, upload, async (req, res) => {
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
      resumeUrl,
    } = req.body;

    let portfolio = await Portfolio.findOne({ username: req.user.username });

    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }

    // Update portfolio fields
    if (contacts !== undefined) portfolio.contacts = JSON.parse(contacts) || {};
    if (skills !== undefined)
      portfolio.skills = JSON.parse(skills).filter((s) => s && s.trim() !== "");
    if (projects !== undefined) portfolio.projects = JSON.parse(projects) || [];
    if (testimonials !== undefined)
      portfolio.testimonials = JSON.parse(testimonials) || [];
    if (displayName !== undefined) portfolio.displayName = displayName || "";
    if (title !== undefined) portfolio.title = title || "";
    if (bio !== undefined) portfolio.bio = bio || "";
    if (theme !== undefined) portfolio.theme = theme || "light";
    if (isPublished !== undefined)
      portfolio.isPublished = isPublished === "true";

    // Handle file uploads to Cloudinary
    if (req.files?.profilePicture) {
      try {
        const result = await uploadToCloudinary(
          req.files.profilePicture[0],
          "profiles",
          "image"
        );
        portfolio.profilePicture = result.secure_url;
        console.log(
          `✅ Profile picture uploaded to Cloudinary: ${portfolio.profilePicture}`
        );
      } catch (error) {
        console.error(
          "❌ Error uploading profile picture to Cloudinary:",
          error
        );
        return res
          .status(500)
          .json({ error: "Failed to upload profile picture" });
      }
    }

    if (req.files?.resumeFile) {
      try {
        const result = await uploadToCloudinary(
          req.files.resumeFile[0],
          "resumes",
          "raw" // Use 'raw' for PDF files
        );
        portfolio.resumeUrl = result.secure_url;
        console.log(`✅ Resume uploaded to Cloudinary: ${portfolio.resumeUrl}`);
      } catch (error) {
        console.error("❌ Error uploading resume to Cloudinary:", error);
        return res.status(500).json({ error: "Failed to upload resume" });
      }
    } else if (resumeUrl !== undefined) {
      portfolio.resumeUrl = resumeUrl || "";
      console.log(`📄 Resume URL updated: ${portfolio.resumeUrl}`);
    }

    const savedPortfolio = await portfolio.save();

    // Emit socket event for real-time updates
    const io = req.app.get("io");
    if (io) {
      io.to(req.user.username.toLowerCase()).emit("portfolioUpdated", {
        username: req.user.username,
        portfolio: savedPortfolio.toObject(),
      });
      console.log(`📡 Emitted portfolio update for: ${req.user.username}`);
    }

    res.json({
      message: "Portfolio updated successfully",
      portfolio: savedPortfolio.toObject(),
    });
  } catch (err) {
    console.error("Error updating portfolio:", err);
    res.status(500).json({ error: err.message || "Error updating portfolio" });
  }
});

module.exports = router;
