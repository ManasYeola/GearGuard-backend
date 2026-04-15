const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'gearguard',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const RETRYABLE_DB_ERRORS = new Set(['ER_LOCK_DEADLOCK', 'ER_LOCK_WAIT_TIMEOUT']);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const syncWithRetry = async (syncOptions, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await sequelize.sync(syncOptions);
      return;
    } catch (error) {
      const isRetryable = RETRYABLE_DB_ERRORS.has(error?.original?.code);
      const isLastAttempt = attempt === maxAttempts;

      if (!isRetryable || isLastAttempt) {
        throw error;
      }

      const backoffMs = attempt * 1000;
      console.warn(
        `Database sync retry ${attempt}/${maxAttempts - 1} after ${error.original.code}. Retrying in ${backoffMs}ms...`
      );
      await delay(backoffMs);
    }
  }
};

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL Connected: ${sequelize.config.host}`);

    // Safe by default to avoid index explosion from repeated alter syncs.
    const shouldAlter = process.env.DB_SYNC_ALTER === 'true';
    const syncOptions = shouldAlter ? { alter: true } : {};

    // Sync all models (create tables if they don't exist)
    await syncWithRetry(syncOptions);
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
