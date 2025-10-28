const Redis = require('ioredis');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Test connection
const testRedis = new Redis(connection);
testRedis.on('connect', () => {
  console.log('✅ Redis connection established');
  testRedis.quit();
});

testRedis.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});

module.exports = { connection };