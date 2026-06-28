require('dotenv').config();
const { initRedis } = require('../queue');

console.log('🔌 Connecting to Redis...');
const { connection, Worker, scrapeQueue, ideasQueue, contentQueue } = initRedis();

connection.on('ready', () => {
  console.log('✅ Redis connected. Starting workers...');
  require('./scrape');
  require('./generate-ideas');
  require('./produce-content');
  console.log('🚀 All workers started. Waiting for jobs...');
});

connection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    console.error('❌ Cannot connect to Redis. Is it running?');
    console.error('   docker run -d --name redis -p 6379:6379 redis');
    process.exit(1);
  }
});
