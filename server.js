const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
app.use(express.json());

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