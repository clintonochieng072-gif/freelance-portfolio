// models/Portfolio.js
const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  id: { type: Number, default: () => Date.now() },
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  github: { type: String, default: "" },
  liveDemo: { type: String, default: "" },
});

const TestimonialSchema = new mongoose.Schema({
  id: { type: Number, default: () => Date.now() },
  clientName: { type: String, default: "" },
  comment: { type: String, default: "" },
  position: { type: String, default: "" },
  company: { type: String, default: "" },
  profilePicture: { type: String, default: "" }, // ✅ ADD profile picture
});

const PortfolioSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    contacts: {
      type: Object,
      default: {},
    },
    skills: { type: [String], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    testimonials: { type: [TestimonialSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Portfolio", PortfolioSchema);
