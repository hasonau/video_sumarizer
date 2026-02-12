require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const summarizeRouter = require('./routes/summarize');
const { PORT } = require('./config/constants');

// Import worker to start processing jobs (works with or without Redis)
try {
  require('./workers/video-processor');
} catch (error) {
  console.warn('⚠️  Could not start worker:', error.message);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files temporarily (for debugging, can be removed in production)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'YT Summarizer API working!',
    version: '2.0.0',
    features: [
      'Background job processing',
      'YouTube URL validation',
      'Video duration checking',
      'Map-reduce summarization'
    ]
  });
});

// Routes
app.use('/api', summarizeRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 OpenAI API Key loaded: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`⏱️  Max video duration: ${Math.floor(require('./config/constants').MAX_VIDEO_DURATION_SECONDS / 60)} minutes`);
  console.log(`🔄 Job queue: ${require('./config/constants').QUEUE_NAME}`);
});
