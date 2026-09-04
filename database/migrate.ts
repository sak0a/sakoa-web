import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql, { type RowDataPacket } from 'mysql2/promise';

const migrationDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const lockName = 'saka_dodgeball_schema_migrations';

function databaseConfig() {
  const database = process.env.DB_NAME || process.env.NUXT_DB_NAME;
  const user = process.env.DB_USER || process.env.NUXT_DB_USER;

  if (!database || !user) {
    throw new Error('DB_NAME and DB_USER are required to run migrations');
  }

  return {
    host: process.env.DB_HOST || process.env.NUXT_DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT || process.env.NUXT_DB_PORT || '3306', 10),
    user,
    password: process.env.DB_PASSWORD || process.env.NUXT_DB_PASSWORD || '',
    database,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true
  };
}

async function listMigrations() {
  return (await readdir(migrationDirectory))
    .filter((file) => /^\d+_[a-z0-9_-]+\.sql$/i.test(file))
    .sort((left, right) => left.localeCompare(right));
}

async function main() {
  const connection = await mysql.createConnection(databaseConfig());

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS app_migrations (
        migration_id VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (migration_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [lockRows] = await connection.execute<RowDataPacket[]>(
      'SELECT GET_LOCK(?, 30) AS acquired',
      [lockName]
    );
    const acquired = Array.isArray(lockRows) && lockRows[0]?.acquired === 1;

    if (!acquired) {
      throw new Error('Could not acquire the database migration lock');
    }

    const [appliedRows] = await connection.query<RowDataPacket[]>(
      'SELECT migration_id FROM app_migrations'
    );
    const applied = new Set(
      appliedRows.map((row) => String(row.migration_id))
    );

    for (const migration of await listMigrations()) {
      if (applied.has(migration)) {
        console.info(JSON.stringify({ event: 'migration_skipped', migration }));
        continue;
      }

      const sql = await readFile(join(migrationDirectory, migration), 'utf8');
      console.info(JSON.stringify({ event: 'migration_started', migration }));
      await connection.query(sql);
      await connection.execute(
        'INSERT INTO app_migrations (migration_id) VALUES (?)',
        [migration]
      );
      console.info(JSON.stringify({ event: 'migration_applied', migration }));
    }
  } finally {
    try {
      await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
    } catch {
      // The connection may already be closed after a network failure.
    }
    await connection.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({
    event: 'migration_failed',
    code: error?.code,
    message: error instanceof Error ? error.message : 'Unknown migration error'
  }));
  process.exitCode = 1;
});
