import { describe, expect, it } from 'vitest'
import { readWorkerConfig, readWorkerDatabaseConfig } from './config'

const databaseEnvironment = {
  DB_HOST: 'database',
  DB_PORT: '3307',
  DB_USER: 'dodgeball',
  DB_PASSWORD: 'private',
  DB_NAME: 'stats',
}

describe('worker environment', () => {
  it('supports deployment-facing Discord and instance variables', () => {
    const config = readWorkerConfig({
      ...databaseEnvironment,
      DISCORD_TOKEN: 'discord-token',
      BOT_INSTANCE_ID: 'worker-a',
    })
    expect(config.discordToken).toBe('discord-token')
    expect(config.instanceId).toBe('worker-a')
    expect(config.database.port).toBe(3307)
  })

  it('allows health checks to load database config without the Discord token', () => {
    expect(readWorkerDatabaseConfig(databaseEnvironment).database).toBe('stats')
  })

  it('allows a disabled worker to start before a token is provisioned', () => {
    expect(readWorkerConfig(databaseEnvironment).discordToken).toBeNull()
  })

  it('reports only invalid variable names', () => {
    expect(() => readWorkerConfig({
      ...databaseEnvironment,
      DB_USER: '',
      DISCORD_TOKEN: 'discord-token',
    })).toThrow('DB_USER')
  })
})
