-- Run with COLORS stopped if its runtime account cannot ALTER.
-- Adds only the revision column; does not modify player preferences.
-- The updated plugin validates the column shape before running.
SET @saka_revision_ddl = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'sakaColors_Clients'
     AND COLUMN_NAME = 'webRevision') = 0,
  'ALTER TABLE sakaColors_Clients ADD COLUMN webRevision INT NOT NULL DEFAULT 0',
  'SELECT 1'
);
PREPARE saka_revision_statement FROM @saka_revision_ddl;
EXECUTE saka_revision_statement;
DEALLOCATE PREPARE saka_revision_statement;
