const { REDIS, QUEUE_NAME } = require('../config/constants');
const { memoryQueue } = require('./memory-queue');

// Default to memory queue
let videoQueue = memoryQueue;
let connection = null;
let useRedis = false;

// Try to use Redis, upgrade if available
try {
  const { Queue } = require('bullmq');
  const IORedis = require('ioredis');

  // Create Redis connection
  connection = new IORedis({
    host: REDIS.host,
    port: REDIS.port,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: () => null, // Don't retry, fail fast
    connectTimeout: 3000, // 3 second timeout
    lazyConnect: true // Don't connect immediately
  });

  // Handle Redis connection errors
  connection.on('error', (err) => {
    console.warn('⚠️  Redis connection error, using in-memory queue');
    useRedis = false;
    videoQueue = memoryQueue;
  });

  connection.on('connect', () => {
    console.log('✅ Redis connected');
  });

  // Try to connect and ping Redis
  connection.connect().then(() => {
    return connection.ping();
  }).then(() => {
    useRedis = true;
    console.log('✅ Redis is available - using BullMQ');
    
    // Create BullMQ queue
    videoQueue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000
        },
        removeOnComplete: {
          age: 3600,
          count: 100
        },
        removeOnFail: {
          age: 86400
        }
      }
    });
  }).catch((err) => {
    console.warn('⚠️  Redis not available, using in-memory queue');
    console.warn('💡 To use Redis: Install and run redis-server');
    useRedis = false;
    videoQueue = memoryQueue;
    // Close failed connection safely (don't worry about errors)
    try {
      if (connection && typeof connection.disconnect === 'function') {
        connection.disconnect();
      }
    } catch (e) {
      // Ignore disconnect errors - connection might already be closed
    }
  });

} catch (error) {
  console.warn('⚠️  BullMQ/Redis not available, using in-memory queue');
  console.warn('💡 For production, install Redis: choco install redis-64');
  useRedis = false;
  videoQueue = memoryQueue;
}

module.exports = { 
  videoQueue, 
  connection, 
  QUEUE_NAME,
  useRedis 
};
