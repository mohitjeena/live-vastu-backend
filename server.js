const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Chunk = require('./models/Chunk')
const fs = require('fs')
const OpenAI = require("openai");

const crypto = require('crypto');

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();

const allowedOrigins = [
  "https://livevaastu.in",
  "https://livevaastu-3717.myshopify.com"
];

// Helper to verify Shopify App Proxy HMAC signature
function verifyShopifyProxy(query, apiSecret) {
  if (!query || !query.signature || !apiSecret) {
    return false;
  }

  const { signature, ...queryParams } = query;

  // 1. Sort query parameters alphabetically and concatenate as key=value without delimiters
  const message = Object.keys(queryParams)
    .sort()
    .map((key) => {
      const val = Array.isArray(queryParams[key])
        ? queryParams[key].join(',')
        : queryParams[key];
      return `${key}=${val}`;
    })
    .join('');

  // 2. Calculate HMAC-SHA256 signature using the Shopify App Secret
  const calculatedSignature = crypto
    .createHmac('sha256', apiSecret)
    .update(message, 'utf-8')
    .digest('hex');

  // 3. Timing-safe comparison to prevent timing attacks
  try {
    const signatureBuffer = Buffer.from(signature, 'hex');
    const calculatedBuffer = Buffer.from(calculatedSignature, 'hex');

    if (signatureBuffer.length !== calculatedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, calculatedBuffer);
  } catch (err) {
    return false;
  }
}

// Middleware
app.use(cors({
    origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use((req, res, next) => {
  // Allow root health-check
  if (req.path === '/' || req.originalUrl === '/') {
    return next();
  }

  // Webhooks and temp-pdf bypass
  if (req.originalUrl.includes('/api/webhooks/orders-paid')) {
    return next();
  }

  if (req.originalUrl.includes('/api/pdf/temp-pdf')) {
    return next();
  }

  // 1. Check Shopify App Proxy signature (New secure way - No key required)
  if (req.query.signature && verifyShopifyProxy(req.query, process.env.SHOPIFY_API_SECRET)) {
    return next();
  }

  // 2. Fallback: Old x-site-key check (Safe migration period)
  const key = req.headers["x-site-key"];
  if (key && process.env.SITE_SECRET_KEY && key === process.env.SITE_SECRET_KEY) {
    return next();
  }

  return res.status(403).json({ error: "Unauthorized" });
});

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

// for user form type
app.use('/api/form-type', require('./routes/userFormType'));

// for fetching user details
app.use('/api/user-details', require('./routes/userDetailsRoute'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB Connected Successfully');
  // Start the automated 10-day PDF cleanup task
  try {
    const { startCleanupScheduler } = require("./utils/cleanupScheduler");
    startCleanupScheduler();
  } catch (error) {
    console.error("Failed to start cleanup scheduler:", error);
  }
})
.catch(err => console.log('MongoDB Connection Error:', err));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Live Vastu Backend API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




