// Vercel serverless entry: all requests go to the Express app
const path = require('path');
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (_) {}

const serverless = require('serverless-http');
const app = require('../app');

module.exports = serverless(app);
