import { readWorkerConfig } from './config'
import { createWorkerPool } from './database'
import { logger } from './logger'
import { DiscordWorker } from './worker'

async function main(): Promise<void> {
  const config = readWorkerConfig()
  const pool = createWorkerPool(config.database)
  const worker = new DiscordWorker(pool, config)

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    void worker.stop(signal)
      .then(() => process.exit(0))
      .catch(error => {
        logger.error('worker_shutdown_failed', { error })
        process.exit(1)
      })
  }

  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))
  await worker.start()
}

main().catch(error => {
  logger.error('worker_start_failed', { error })
  process.exitCode = 1
})
