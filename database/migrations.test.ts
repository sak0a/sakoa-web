import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import {
  defaultDiscordBotSettings,
  discordJobTypes,
} from '../server/services/discord-schema'

const discordMigrationUrl = new URL('./migrations/002_discord_worker.sql', import.meta.url)

describe('Discord database migration contract', () => {
  it('keeps the database accent default aligned with the application default', async () => {
    const sql = await readFile(discordMigrationUrl, 'utf8')
    const match = sql.match(/embed_accent_color INT UNSIGNED NOT NULL DEFAULT (\d+)/)

    expect(match?.[1]).toBe(String(defaultDiscordBotSettings.embedAccentColor))
  })

  it('constrains persisted job types and statuses to values understood by the worker', async () => {
    const sql = await readFile(discordMigrationUrl, 'utf8')
    const jobTypeValues = discordJobTypes.map(value => `'${value}'`).join(', ')

    expect(sql).toContain(`job_type ENUM(${jobTypeValues}) NOT NULL`)
    expect(sql).toContain("status ENUM('queued', 'running', 'completed', 'failed') NOT NULL DEFAULT 'queued'")
  })
})
