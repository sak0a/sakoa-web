import { DiscordRepository } from '../repositories/discord'
import { getDbConnection } from './database.js'

export async function getDiscordRepository(): Promise<DiscordRepository> {
  const pool = await getDbConnection()
  return new DiscordRepository(pool)
}
