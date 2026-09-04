import mysql from 'mysql2/promise';
import { useRuntimeConfig } from '#imports';

let pool = null;
let cachedConfig = null;

function readEnvironmentConfig() {
  return {
    dbHost: process.env.NUXT_DB_HOST || process.env.DB_HOST || 'localhost',
    dbPort: process.env.NUXT_DB_PORT || process.env.DB_PORT || '3306',
    dbUser: process.env.NUXT_DB_USER || process.env.DB_USER || 'root',
    dbPassword: process.env.NUXT_DB_PASSWORD || process.env.DB_PASSWORD || '',
    dbName: process.env.NUXT_DB_NAME || process.env.DB_NAME || 'sakaStats'
  };
}

function getDbConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const config = useRuntimeConfig();
    cachedConfig = {
      dbHost: config.dbHost || 'localhost',
      dbPort: config.dbPort || '3306',
      dbUser: config.dbUser || 'root',
      dbPassword: config.dbPassword || '',
      dbName: config.dbName || 'sakaStats'
    };
  } catch {
    cachedConfig = readEnvironmentConfig();
  }

  return cachedConfig;
}

function connectionDetails(config, status) {
  return {
    host: config.dbHost,
    port: Number.parseInt(config.dbPort, 10),
    user: config.dbUser,
    database: config.dbName,
    status,
    timestamp: new Date().toISOString()
  };
}

function safeDatabaseError(error) {
  return {
    message: error instanceof Error ? error.message : 'Unknown database error',
    code: error?.code,
    errno: error?.errno,
    sqlState: error?.sqlState,
    timestamp: new Date().toISOString()
  };
}

function createPool() {
  const config = getDbConfig();

  return mysql.createPool({
    host: config.dbHost,
    port: Number.parseInt(config.dbPort, 10),
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 5,
    idleTimeout: 60_000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
}

export function reloadDatabaseConfig() {
  cachedConfig = readEnvironmentConfig();
  return { ...cachedConfig };
}

export async function getDbConnection() {
  if (!pool) {
    pool = createPool();
  }

  return pool;
}

export async function closeDbConnection() {
  if (!pool) {
    return;
  }

  const activePool = pool;
  pool = null;
  await activePool.end();
}

export async function executeQuery(query, params = []) {
  const activePool = await getDbConnection();
  const [rows] = await activePool.execute(query, params);
  return rows;
}

export async function withTransaction(callback) {
  const activePool = await getDbConnection();
  const connection = await activePool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function testDbConnection() {
  const config = getDbConfig();
  let connection;

  try {
    connection = await mysql.createConnection({
      host: config.dbHost,
      port: Number.parseInt(config.dbPort, 10),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      charset: 'utf8mb4',
      timezone: 'Z',
      connectTimeout: 5_000
    });
    await connection.execute('SELECT 1 AS connection_test');

    return {
      success: true,
      connection: connectionDetails(config, 'connected')
    };
  } catch (error) {
    return {
      success: false,
      error: safeDatabaseError(error),
      connection: connectionDetails(config, 'failed')
    };
  } finally {
    await connection?.end().catch(() => {});
  }
}

export async function retryDbConnection() {
  await closeDbConnection();
  const result = await testDbConnection();

  return {
    ...result,
    message: result.success
      ? 'Database reconnection successful'
      : 'Database reconnection failed'
  };
}

export async function getDbStatus() {
  const config = getDbConfig();

  try {
    const activePool = await getDbConnection();
    await activePool.execute('SELECT 1 AS connection_test');

    return {
      connected: true,
      connection: connectionDetails(config, 'connected')
    };
  } catch (error) {
    return {
      connected: false,
      error: safeDatabaseError(error),
      connection: connectionDetails(config, 'failed')
    };
  }
}

export async function getCurrentConnectionState() {
  const config = getDbConfig();

  if (!pool) {
    return {
      connected: false,
      connection: connectionDetails(config, 'no_connection')
    };
  }

  return getDbStatus();
}

export async function reloadConfigAndReconnect() {
  await closeDbConnection();
  const freshConfig = reloadDatabaseConfig();
  const result = await testDbConnection();

  return {
    ...result,
    message: result.success
      ? 'Database configuration reloaded and reconnection successful'
      : 'Database configuration reloaded but reconnection failed',
    config: {
      host: freshConfig.dbHost,
      port: Number.parseInt(freshConfig.dbPort, 10),
      user: freshConfig.dbUser,
      database: freshConfig.dbName,
      passwordSet: Boolean(freshConfig.dbPassword)
    }
  };
}
