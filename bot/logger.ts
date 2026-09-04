type LogLevel = 'info' | 'warn' | 'error'

function normalizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (/token|password|secret/i.test(key)) {
      normalized[key] = '[redacted]'
    } else if (value instanceof Error) {
      normalized[key] = { name: value.name, message: value.message }
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

function write(level: LogLevel, event: string, metadata: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'discord-worker',
    level,
    event,
    ...normalizeMetadata(metadata),
  })
  const output = level === 'error' ? process.stderr : process.stdout
  output.write(`${line}\n`)
}

export const logger = {
  info: (event: string, metadata?: Record<string, unknown>) => write('info', event, metadata),
  warn: (event: string, metadata?: Record<string, unknown>) => write('warn', event, metadata),
  error: (event: string, metadata?: Record<string, unknown>) => write('error', event, metadata),
}
