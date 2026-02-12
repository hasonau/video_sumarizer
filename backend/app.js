const path = require('path');
const express = require('express');
const cors = require('cors');
const summarizeRouter = require('./routes/summarize');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

const isVercel = !!process.env.VERCEL;

// CORS
const corsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (no-op on Vercel; used when running locally)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', apiLimiter);

// Health / "server is running" - confirms deployment
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: isVercel ? 'Server is running (deployed on Vercel)' : 'Server is running',
    status: 'ok',
    deployed: isVercel,
    version: '2.0.0',
    endpoints: {
      'POST /api/summarize': 'YouTube URL - create summarization job',
      'POST /api/upload': 'Upload video file - create summarization job',
      'GET /api/status/:jobId': 'Get job status and result'
    }
  });
});

app.use('/api', summarizeRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

module.exports = app;
