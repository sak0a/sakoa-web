import mysql from 'mysql2/promise';
import { useRuntimeConfig } from '#imports';

let connection = null;
let cachedConfig = null;

// Function to reload environment variables and get fresh database config
export function reloadDatabaseConfig() {
  console.log('Reloading database configuration from environment variables...');

  // Clear cached config to force reload
  cachedConfig = null;

  // Get fresh config from environment variables
  const freshConfig = {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'sakaStats'
  };

  // Cache the fresh config
  cachedConfig = freshConfig;

  console.log('Database configuration reloaded:', {
    host: freshConfig.dbHost,
    port: freshConfig.dbPort,
    user: freshConfig.dbUser,
    database: freshConfig.dbName,
    passwordSet: !!freshConfig.dbPassword
  });

  return freshConfig;
}

// Function to get database config (either cached fresh config or runtime config)
function getDbConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Fall back to runtime config if no fresh config is cached
  const config = useRuntimeConfig();
  return {
    dbHost: config.dbHost,
    dbPort: config.dbPort,
    dbUser: config.dbUser,
    dbPassword: config.dbPassword,
    dbName: config.dbName
  };
}

export async function getDbConnection() {
  if (connection) {
    try {
      // Test if connection is still alive
      await connection.ping();
      return connection;
    } catch (error) {
      console.warn('Database connection lost, creating new connection');
      connection = null;
    }
  }

  const config = getDbConfig();

  try {
    connection = await mysql.createConnection({
      host: config.dbHost,
      port: parseInt(config.dbPort),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      charset: 'utf8mb4',
      timezone: '+00:00'
    });

    console.log('Database connection established successfully');
    return connection;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

export async function closeDbConnection() {
  if (connection) {
    try {
      await connection.end();
      connection = null;
      console.log('Database connection closed');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Helper function to execute queries with error handling
export async function executeQuery(query, params = []) {
  try {
    const conn = await getDbConnection();
    const [rows] = await conn.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Test database connection without creating a persistent connection
export async function testDbConnection() {
  const config = getDbConfig();
  let testConnection = null;

  try {
    testConnection = await mysql.createConnection({
      host: config.dbHost,
      port: parseInt(config.dbPort),
      user: config.dbUser,
      password: config.dbPassword,
      database: config.dbName,
      charset: 'utf8mb4',
      timezone: '+00:00'
    });

    // Test the connection with a simple query
    await testConnection.ping();
    await testConnection.execute('SELECT 1 as test');

    const connectionInfo = {
      host: config.dbHost,
      port: parseInt(config.dbPort),
      user: config.dbUser,
      database: config.dbName,
      status: 'connected',
      timestamp: new Date().toISOString()
    };

    await testConnection.end();
    return { success: true, connection: connectionInfo };
  } catch (error) {
    console.error('Database connection test failed:', error);

    if (testConnection) {
      try {
        await testConnection.end();
      } catch (closeError) {
        console.warn('Error closing test connection:', closeError);
      }
    }

    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        timestamp: new Date().toISOString()
      },
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'failed',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Force reconnection by closing current connection and creating a new one
export async function retryDbConnection() {
  console.log('Forcing database reconnection...');

  // Close existing connection
  await closeDbConnection();

  // Test new connection
  const testResult = await testDbConnection();

  if (testResult.success) {
    console.log('Database reconnection successful');
    // The next call to getDbConnection() will create a fresh connection
    return { success: true, message: 'Database reconnection successful', connection: testResult.connection };
  } else {
    console.error('Database reconnection failed:', testResult.error);
    return { success: false, message: 'Database reconnection failed', error: testResult.error, connection: testResult.connection };
  }
}

// Get current database connection status
export async function getDbStatus() {
  const config = getDbConfig();

  // If no connection exists, try to establish one to get accurate status
  if (!connection) {
    try {
      // Try to establish a connection using the main getDbConnection function
      await getDbConnection();
      // If successful, connection variable is now set
      return {
        connected: true,
        connection: {
          host: config.dbHost,
          port: parseInt(config.dbPort),
          user: config.dbUser,
          database: config.dbName,
          status: 'connected',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      // Connection failed
      return {
        connected: false,
        error: {
          message: error.message,
          code: error.code,
          timestamp: new Date().toISOString()
        },
        connection: {
          host: config.dbHost,
          port: parseInt(config.dbPort),
          user: config.dbUser,
          database: config.dbName,
          status: 'failed',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Connection exists, test if it's still alive
  try {
    await connection.ping();
    return {
      connected: true,
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    // Connection exists but is dead, mark it as null and return failed status
    connection = null;
    return {
      connected: false,
      error: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'failed',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Get current connection state without attempting to connect
export async function getCurrentConnectionState() {
  const config = getDbConfig();

  if (!connection) {
    return {
      connected: false,
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'no_connection',
        timestamp: new Date().toISOString()
      }
    };
  }

  try {
    await connection.ping();
    return {
      connected: true,
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'connected',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    // Connection exists but is dead
    connection = null;
    return {
      connected: false,
      error: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      },
      connection: {
        host: config.dbHost,
        port: parseInt(config.dbPort),
        user: config.dbUser,
        database: config.dbName,
        status: 'failed',
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Reload environment variables and force database reconnection
export async function reloadConfigAndReconnect() {
  console.log('Reloading database configuration and forcing reconnection...');

  // Close existing connection
  await closeDbConnection();

  // Reload configuration from environment variables
  const freshConfig = reloadDatabaseConfig();

  // Test new connection with fresh config
  const testResult = await testDbConnection();

  if (testResult.success) {
    console.log('Database configuration reload and reconnection successful');
    return {
      success: true,
      message: 'Database configuration reloaded and reconnection successful',
      connection: testResult.connection,
      config: {
        host: freshConfig.dbHost,
        port: parseInt(freshConfig.dbPort),
        user: freshConfig.dbUser,
        database: freshConfig.dbName,
        passwordSet: !!freshConfig.dbPassword
      }
    };
  } else {
    console.error('Database configuration reload and reconnection failed:', testResult.error);
    return {
      success: false,
      message: 'Database configuration reloaded but reconnection failed',
      error: testResult.error,
      connection: testResult.connection,
      config: {
        host: freshConfig.dbHost,
        port: parseInt(freshConfig.dbPort),
        user: freshConfig.dbUser,
        database: freshConfig.dbName,
        passwordSet: !!freshConfig.dbPassword
      }
    };
  }
}
