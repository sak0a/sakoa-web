import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const source = resolve('database/migrations')
const destination = resolve('.output/services/database/migrations')

const migrations = (await readdir(source))
  .filter(file => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))

if (migrations.length === 0) {
  throw new Error(`No numbered SQL migrations found in ${source}`)
}

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await Promise.all(migrations.map(file => cp(resolve(source, file), resolve(destination, file))))

console.info(`Copied ${migrations.length} database migration(s) into the service bundle`)
