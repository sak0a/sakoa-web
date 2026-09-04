import { describe, expect, it, vi } from 'vitest'
import type { Pool } from 'mysql2/promise'
import { DiscordRepository } from './discord'

const editableSettings = {
  enabled: true,
  publishingEnabled: true,
  guildId: '12345678901234567',
  statusChannelId: '22345678901234567',
  updateIntervalSeconds: 60,
  embedHeading: 'Arena status',
  embedAccentColor: 0x8b55ff,
  contentText: '',
  showPlayerNames: true,
}

function connectionWith(execute: ReturnType<typeof vi.fn>) {
  return {
    beginTransaction: vi.fn().mockResolvedValue(undefined),
    execute,
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    release: vi.fn(),
  }
}

describe('Discord settings repository', () => {
  it('updates and reads the resulting revision in one transaction', async () => {
    const updatedAt = new Date('2026-09-04T12:00:00.000Z')
    const execute = vi.fn()
      .mockResolvedValueOnce([{ affectedRows: 1 }, []])
      .mockResolvedValueOnce([[{
        enabled: 1,
        publishing_enabled: 1,
        guild_id: editableSettings.guildId,
        status_channel_id: editableSettings.statusChannelId,
        update_interval_seconds: 60,
        embed_heading: 'Arena status',
        embed_accent_color: 0x8b55ff,
        content_text: '',
        show_player_names: 1,
        revision: 4,
        updated_at: updatedAt,
        updated_by: 'actor',
      }], []])
    const connection = connectionWith(execute)
    const pool = { getConnection: vi.fn().mockResolvedValue(connection) } as unknown as Pool
    const repository = new DiscordRepository(pool)

    const result = await repository.updateSettings(editableSettings, 3, 'actor')

    expect(result.revision).toBe(4)
    expect(connection.beginTransaction).toHaveBeenCalledOnce()
    expect(connection.commit).toHaveBeenCalledOnce()
    expect(connection.rollback).not.toHaveBeenCalled()
    expect(connection.release).toHaveBeenCalledOnce()
  })

  it('rolls back an optimistic revision conflict', async () => {
    const execute = vi.fn().mockResolvedValueOnce([{ affectedRows: 0 }, []])
    const connection = connectionWith(execute)
    const pool = { getConnection: vi.fn().mockResolvedValue(connection) } as unknown as Pool
    const repository = new DiscordRepository(pool)

    await expect(repository.updateSettings(editableSettings, 2, 'actor'))
      .rejects.toMatchObject({ name: 'RevisionConflictError' })
    expect(connection.commit).not.toHaveBeenCalled()
    expect(connection.rollback).toHaveBeenCalledOnce()
    expect(connection.release).toHaveBeenCalledOnce()
  })
})
