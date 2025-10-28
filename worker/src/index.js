const { Worker } = require('bullmq');
const { connection } = require('./config/redis');
const { generateRecommendations } = require('./services/recommendationService');
require('dotenv').config();

const WORKER_NAME = process.env.WORKER_NAME || `worker-${Math.random().toString(36).substr(2, 9)}`;
const CONCURRENCY = parseInt(process.env.CONCURRENCY) || 2;

console.log(`
Starting Worker: ${WORKER_NAME}
Concurrency: ${CONCURRENCY}
Redis: ${connection.host}:${connection.port}
`);

const worker = new Worker(
  'recommendations',
  async (job) => {
    const startTime = Date.now();
    console.log(`\n[${WORKER_NAME}] Processing job ${job.id}...`);

    const { propertyId, userId, filters, algorithm } = job.data;

    try {
      await job.updateProgress(10);
      await job.updateProgress(30);
      
      const result = await generateRecommendations(
        propertyId,
        userId,
        filters,
        algorithm
      );
      
      await job.updateProgress(80);
      await job.updateProgress(100);

      const duration = Date.now() - startTime;
      console.log(`[${WORKER_NAME}] Job ${job.id} completed in ${duration}ms`);

      return result;
    } catch (error) {
      console.error(`[${WORKER_NAME}] Job ${job.id} failed:`, error.message);
      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  }
);

worker.on('completed', (job) => {
  console.log(`[${WORKER_NAME}] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[${WORKER_NAME}] Job ${job?.id} failed: ${err.message}`);
});

worker.on('error', (err) => {
  console.error(`[${WORKER_NAME}] Worker error:`, err.message);
});

process.on('SIGTERM', async () => {
  console.log(`[${WORKER_NAME}] Shutting down...`);
  await worker.close();
  process.exit(0);
});

console.log(`[${WORKER_NAME}] Listening for jobs...`);