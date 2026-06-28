/**
 * BullMQ Queue Setup — requires Redis.
 * Server + UI work without Redis. Workers need Redis.
 */
let connection = null;
let scrapeQueue = null;
let ideasQueue = null;
let contentQueue = null;
let Worker = null;

function initRedis() {
  if (connection) return { connection, Worker, scrapeQueue, ideasQueue, contentQueue };

  const IORedis = require('ioredis');
  const BullMQ = require('bullmq');
  Worker = BullMQ.Worker;

  connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
  });

  connection.on('error', () => {}); // silent - server works without Redis

  scrapeQueue = new BullMQ.Queue('scrape', { connection });
  ideasQueue = new BullMQ.Queue('generate-ideas', { connection });
  contentQueue = new BullMQ.Queue('produce-content', { connection });

  return { connection, Worker, scrapeQueue, ideasQueue, contentQueue };
}

async function enqueue(queue, name, data) {
  if (!queue) {
    console.warn(`Job "${name}" skipped: Queue not initialized.`);
    return null;
  }
  try {
    return await queue.add(name, data);
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn(`⚠️  Redis unavailable. Job "${name}" skipped.`);
      return null;
    }
    console.error(`Failed to enqueue "${name}": ${err.message}`);
    return null;
  }
}

module.exports = { initRedis, enqueue };
