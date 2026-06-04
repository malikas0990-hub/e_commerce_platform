require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');
const { sequelize } = require('./models');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./socket');
const { runSeed } = require('./seed');

const PORT = process.env.PORT || 5000;

async function start() {
  // Retry DB connection — Postgres container may still be booting.
  let connected = false;
  for (let i = 1; i <= 10 && !connected; i++) {
    try {
      await sequelize.authenticate();
      connected = true;
    } catch (err) {
      logger.warn(`DB connection failed (attempt ${i}/10): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  if (!connected) {
    logger.error('Could not connect to Postgres. Exiting.');
    process.exit(1);
  }

  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  logger.info('Database ready (sync complete)');

  await connectRedis().catch((e) => logger.warn(`Redis connection failed: ${e.message}`));

  if (process.env.SEED_ON_START !== 'false') {
    await runSeed().catch((e) => logger.warn(`Seed skipped: ${e.message}`));
  }

  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => logger.info(`✅ Server running on port ${PORT}`));
}

start();
