-- Migration to add notes column to sakaDonate_donations table
-- Run this if your table was created by the SourcePawn plugin without the notes column

-- First, let's check the current table structure
DESCRIBE dodgeball.sakaDonate_donations;

-- Add the notes column (this will fail gracefully if column already exists)
-- You can ignore the error if the column already exists
ALTER TABLE dodgeball.sakaDonate_donations
ADD COLUMN notes TEXT DEFAULT NULL COMMENT 'Optional notes about the donation';

-- Verify the column was added
DESCRIBE dodgeball.sakaDonate_donations;

-- Optional: Check if there are any existing donations without notes
SELECT COUNT(*) as total_donations,
       COUNT(notes) as donations_with_notes,
       (COUNT(*) - COUNT(notes)) as donations_without_notes
FROM dodgeball.sakaDonate_donations;
