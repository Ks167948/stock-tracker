const { Queue } = require('bullmq');

const connection = process.env.REDIS_URL
  ? (() => {
      const url = new URL(process.env.REDIS_URL);
      return {
        host: url.hostname,
        port: parseInt(url.port),
        password: url.password || undefined,
      };
    })()
  : { host: 'localhost', port: 6379 };

const alertQueue = new Queue('alert-checks', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

console.log('📋 Alert queue initialized');

module.exports = { alertQueue, connection };