# Database utilities

`bun run db:migrate` runs only the numbered files in `migrations/`. These create the platform control tables; they do not create or upgrade the external SourcePawn donor tables.

The following legacy SQL utilities are retained for manual donor-table setup and troubleshooting:

- `alter_table_queries.sql`: adds website fields to an existing `sakaDonate_users` table, creates `sakaDonate_donations`, and creates the summary view and indexes.
- `check_notes_column.sql`: inspects the donation table and checks for `notes`. Its final sample query requires that column to exist.
- `add_notes_column.sql`: adds `notes` to an existing donation table when missing.

These scripts target the `dodgeball` database explicitly. Adjust the database name to match the installation and inspect the existing schema before selecting statements to run. The setup script assumes the SourcePawn users table already exists with a compatible indexed `steamid` column. The ALTER, CREATE TABLE, view, and index statements are not repeatable migrations: skip objects or columns that already exist. Back up the affected tables before making changes.

These utilities are not run by application builds, deployments, or the migration runner. They contain no donor inserts.
