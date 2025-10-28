const { Queue } = require('bullmq');
const { connection } = require('./config/redis');

const recommendationsQueue = new Queue('recommendations', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
    },
    removeOnFail: {
      count: 50,
    },
  },
});

module.exports = { recommendationsQueue };