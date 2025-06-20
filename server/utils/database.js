import mysql from 'mysql2/promise';
import { useRuntimeConfig } from '#imports';

let connection = null;

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

  const config = useRuntimeConfig();
  
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
