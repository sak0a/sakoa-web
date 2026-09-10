-- Diagnostic script to check if the notes column exists in sakaDonate_donations table

-- Check table structure
SELECT 'Current table structure:' as info;
DESCRIBE dodgeball.sakaDonate_donations;

-- Check if notes column exists
SELECT
    CASE
        WHEN COUNT(*) > 0 THEN 'NOTES COLUMN EXISTS ✓'
        ELSE 'NOTES COLUMN MISSING ✗ - Run add_notes_column.sql'
    END as notes_column_status
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'dodgeball'
AND TABLE_NAME = 'sakaDonate_donations'
AND COLUMN_NAME = 'notes';

-- Show sample data to check if notes are being stored
SELECT 'Sample donation data:' as info;
SELECT id, steamid, amount, donation_date, notes
FROM dodgeball.sakaDonate_donations
ORDER BY id DESC
LIMIT 5;
