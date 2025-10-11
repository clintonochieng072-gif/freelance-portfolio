const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  amount: Number,
  currency: String,
  status: { type: String, enum: ["pending", "success", "failed"] },
  providerReference: String,
  ownerPortfolio: { type: mongoose.Schema.Types.ObjectId, ref: "Portfolio" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
