import { z } from 'zod'

const integerFromEnvironment = (fallback: number, minimum: number, maximum: number) => z.preprocess(
  value => value === undefined || value === '' ? fallback : Number(value),
  z.number().int().min(minimum).max(maximum),
)

const databaseEnvironmentSchema = z.object({
  DB_HOST: z.string().trim().min(1),
  DB_PORT: integerFromEnvironment(3306, 1, 65535),
  DB_USER: z.string().trim().min(1),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string().trim().min(1),
})

const workerEnvironmentSchema = databaseEnvironmentSchema.extend({
  DISCORD_BOT_TOKEN: z.string().trim().min(1).optional(),
  DISCORD_JOB_POLL_MS: integerFromEnvironment(2000, 500, 60_000),
  DISCORD_CONFIG_POLL_MS: integerFromEnvironment(10_000, 1000, 300_000),
  DISCORD_HEARTBEAT_MS: integerFromEnvironment(15_000, 5000, 60_000),
  DISCORD_JOB_LOCK_SECONDS: integerFromEnvironment(120, 30, 3600),
  BOT_INSTANCE_ID: z.string().trim().min(1).max(100).optional(),
})

export interface WorkerConfig {
  database: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  discordToken: string | null
  instanceId?: string
  jobPollMilliseconds: number
  configPollMilliseconds: number
  heartbeatMilliseconds: number
  jobLockSeconds: number
}

export type WorkerDatabaseConfig = WorkerConfig['database']

function canonicalEnvironment(environment: NodeJS.ProcessEnv): Record<string, string | undefined> {
  return {
    ...environment,
    // DB_PASS was used by the old standalone bot. DB_PASSWORD is canonical.
    DB_PASSWORD: environment.DB_PASSWORD ?? environment.DB_PASS ?? '',
    // DISCORD_TOKEN is the deployment-facing name; retain the explicit alias for local migration.
    DISCORD_BOT_TOKEN: (environment.DISCORD_BOT_TOKEN ?? environment.DISCORD_TOKEN)?.trim() || undefined,
  }
}

export function readWorkerDatabaseConfig(environment: NodeJS.ProcessEnv = process.env): WorkerDatabaseConfig {
  const result = databaseEnvironmentSchema.safeParse(canonicalEnvironment(environment))
  if (!result.success) {
    const names = [...new Set(result.error.issues.map(issue => issue.path.join('.')))].join(', ')
    throw new Error(`Invalid database environment configuration: ${names}`)
  }
  return {
    host: result.data.DB_HOST,
    port: result.data.DB_PORT,
    user: result.data.DB_USER,
    password: result.data.DB_PASSWORD,
    database: result.data.DB_NAME,
  }
}

export function readWorkerConfig(environment: NodeJS.ProcessEnv = process.env): WorkerConfig {
  const result = workerEnvironmentSchema.safeParse(canonicalEnvironment(environment))
  if (!result.success) {
    const names = [...new Set(result.error.issues.map(issue => issue.path.join('.')))].join(', ')
    throw new Error(`Invalid worker environment configuration: ${names}`)
  }

  const value = result.data
  return {
    database: {
      host: value.DB_HOST,
      port: value.DB_PORT,
      user: value.DB_USER,
      password: value.DB_PASSWORD,
      database: value.DB_NAME,
    },
    discordToken: value.DISCORD_BOT_TOKEN ?? null,
    instanceId: value.BOT_INSTANCE_ID,
    jobPollMilliseconds: value.DISCORD_JOB_POLL_MS,
    configPollMilliseconds: value.DISCORD_CONFIG_POLL_MS,
    heartbeatMilliseconds: value.DISCORD_HEARTBEAT_MS,
    jobLockSeconds: value.DISCORD_JOB_LOCK_SECONDS,
  }
}
