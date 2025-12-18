const mongoose = require("mongoose");

const EmailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  email_otp: {
    type: String,
    required: true
  },
  email_otp_expires: {
    type: Date,
    required: true
  },
  email_verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("EmailOtp", EmailOtpSchema);
