const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema({
  chunkId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  text: { type: String, required: true },
  length: { type: Number }
}, { timestamps: true });

// export default mongoose.model("Chunk", chunkSchema);
module.exports = mongoose.model('Chunk', chunkSchema);
