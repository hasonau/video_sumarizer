/**
 * In-memory job queue (fallback when Redis is not available)
 * This is simpler but jobs are lost on server restart
 */

class MemoryQueue {
  constructor() {
    this.jobs = new Map();
    this.workers = [];
  }

  async add(jobName, data, options = {}) {
    const jobId = options.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      name: jobName,
      data,
      progress: { progress: 0, stage: 'pending' },
      state: 'waiting',
      createdAt: Date.now(),
      returnvalue: null,
      failedReason: null
    };
    
    this.jobs.set(jobId, job);
    
    // Process job asynchronously (non-blocking)
    if (this.workers.length > 0) {
      setImmediate(() => this.processJob(job));
    }
    
    return { id: jobId };
  }

  async getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  async processJob(job) {
    if (this.workers.length === 0) {
      console.warn('No workers registered for memory queue');
      return;
    }
    
    const worker = this.workers[0];
    job.state = 'active';
    
    try {
      console.log(`[Memory Queue] Processing job ${job.id}...`);
      const result = await worker(job);
      job.state = 'completed';
      job.returnvalue = result;
      job.progress = { progress: 100, stage: 'completed' };
      console.log(`[Memory Queue] Job ${job.id} completed`);
    } catch (error) {
      job.state = 'failed';
      job.failedReason = error.message;
      console.error(`[Memory Queue] Job ${job.id} failed:`, error.message);
    }
  }

  registerWorker(workerFn) {
    this.workers.push(workerFn);
  }
}

// Singleton instance
const memoryQueue = new MemoryQueue();

module.exports = { memoryQueue };
