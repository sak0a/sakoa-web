import mysql, { type Pool } from 'mysql2/promise'
import type { WorkerConfig } from './config'

export function createWorkerPool(config: WorkerConfig['database']): Pool {
  return mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    queueLimit: 0,
  })
}
