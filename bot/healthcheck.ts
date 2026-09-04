import mysql, { type RowDataPacket } from 'mysql2/promise'
import { z } from 'zod'
import { readWorkerDatabaseConfig } from './config'

interface HealthRow extends RowDataPacket {
  connection_state: string
  heartbeat_at: Date | string | null
}

const thresholdSchema = z.preprocess(
  value => value === undefined || value === '' ? 60 : Number(value),
  z.number().int().min(15).max(600),
)

async function main(): Promise<void> {
  const database = readWorkerDatabaseConfig()
  const staleAfterSeconds = thresholdSchema.parse(
    process.env.BOT_HEARTBEAT_STALE_SECONDS ?? process.env.DISCORD_HEALTH_STALE_SECONDS,
  )
  const connection = await mysql.createConnection({
    ...database,
    charset: 'utf8mb4',
    timezone: 'Z',
    connectTimeout: 5000,
  })
  try {
    const [rows] = await connection.execute<HealthRow[]>(
      'SELECT connection_state, heartbeat_at FROM discord_bot_runtime WHERE id = 1',
    )
    const runtime = rows[0]
    if (!runtime?.heartbeat_at) throw new Error('Discord worker has not written a heartbeat')
    const heartbeat = runtime.heartbeat_at instanceof Date
      ? runtime.heartbeat_at
      : new Date(runtime.heartbeat_at)
    if (!Number.isFinite(heartbeat.getTime())) throw new Error('Discord worker heartbeat is invalid')
    if (Date.now() - heartbeat.getTime() > staleAfterSeconds * 1000) {
      throw new Error('Discord worker heartbeat is stale')
    }
    if (runtime.connection_state === 'stopped' || runtime.connection_state === 'stopping') {
      throw new Error(`Discord worker state is ${runtime.connection_state}`)
    }
  } finally {
    await connection.end()
  }
}

main().catch(error => {
  const message = error instanceof Error ? error.message : 'Discord worker health check failed'
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
})
