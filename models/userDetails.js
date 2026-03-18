const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserSubmission",
    required: true
  },

  name: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  facing: {
    type: String,
    enum: ["north", "south", "east", "west", "ne", "nw", "se", "sw"],
    required: true
  },

  area: {
    type: Number,
    required: true
  },

  type: {
    type: String,
    enum: ["residential", "commercial"],
    required: true
  },

  floor: {
    type: String,
    required: true
  },

  family: {
    members: { type: Number, required: true },
    adults: { type: Number, required: true },
    children: { type: Number, default: 0 },
    elders: { type: Number, default: 0 }
  },

  profession: {
    type: String,
    required: true
  },

  workFromHome: {
    type: String,
    enum: ["yes", "no"],
    required: true
  },

  stability: {
    type: String,
    enum: ["stable", "fluctuating"],
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("UserDetails", userDetailsSchema);