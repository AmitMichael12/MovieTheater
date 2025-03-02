const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  status: { type: String, enum: ["available", "reserved" , "booked"], default: "available" },
  reservedBy: { type: String, default: null }, // user ID
  reservedAt: { type: Date, default: null },  // Time when reserved
});

const screeningSchema = new mongoose.Schema({
  screeningTime: { type: String, required: true },
  seats: [seatSchema],
});

const Screening = mongoose.model("Screening", screeningSchema);

module.exports = Screening;
