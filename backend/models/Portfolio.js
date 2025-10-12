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
  profilePicture: { type: String, default: "" },
});

const PortfolioSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    displayName: { type: String, default: "" },
    title: { type: String, default: "Freelance Portfolio" },
    bio: { type: String, default: "" },
    contacts: {
      type: Object,
      default: {},
    },
    skills: { type: [String], default: [] },
    projects: { type: [ProjectSchema], default: [] },
    testimonials: { type: [TestimonialSchema], default: [] },
    theme: {
      type: String,
      enum: ["light", "dark", "blue", "green"],
      default: "light",
    },
    isPublished: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Portfolio", PortfolioSchema);
