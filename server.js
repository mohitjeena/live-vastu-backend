const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Chunk = require('./models/Chunk')
const fs = require('fs')
const OpenAI = require("openai");

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}



const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/questions', require('./routes/questions'));
app.use('/api/admin', require('./routes/admin'));
// routes for save user data
app.use('/api/user-submissions', require('./routes/userSubmissions'));
// for plans
app.use('/api/plans', require('./routes/plans'));
// for webhooks
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/upload-image', require('./routes/imageUpload'));
app.use('/api/pdf', require('./routes/sendVastuPdf'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Live Vastu Backend API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateEmbeddings() {
  try {
    const orderChunks = await Chunk.find({})

      for (let i = 0; i < orderChunks.length; i++) {
         const chunk = orderChunks[i];

           await Chunk.updateOne(
        { _id: chunk._id },
        { $set: { order: i } }
      );

      }


    console.log("Chunks to embed:");

  } catch (err) {
    console.error("Embedding error:", err);
  } 
}

generateEmbeddings();