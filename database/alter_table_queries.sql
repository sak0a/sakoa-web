-- ALTER TABLE queries to update existing sakaDonate_users table
-- Run these queries in order on your existing database

-- Step 1: Add new columns to sakaDonate_users table
ALTER TABLE dodgeball.sakaDonate_users 
ADD COLUMN show_on_website BOOLEAN DEFAULT FALSE COMMENT 'Whether user wants to be shown on website';

ALTER TABLE dodgeball.sakaDonate_users 
ADD COLUMN display_name VARCHAR(64) DEFAULT NULL COMMENT 'Name to display on website (optional)';

ALTER TABLE dodgeball.sakaDonate_users 
ADD COLUMN tier VARCHAR(32) DEFAULT 'Supporter' COMMENT 'Donation tier (VIP, Premium, Elite, Supporter, SAS)';

-- Step 2: Create indexes for better performance on new columns
CREATE INDEX idx_show_on_website ON dodgeball.sakaDonate_users(show_on_website);
CREATE INDEX idx_tier ON dodgeball.sakaDonate_users(tier);
CREATE INDEX idx_display_name ON dodgeball.sakaDonate_users(display_name);

-- Step 3: Create sakaDonate_donations table for individual donation records
CREATE TABLE dodgeball.sakaDonate_donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steamid VARCHAR(64) NOT NULL,
    amount DECIMAL(10,2) NOT NULL COMMENT 'Donation amount in EUR',
    donation_date DATE NOT NULL COMMENT 'Date of donation',
    added_date INT DEFAULT 0 COMMENT 'Unix timestamp when record was added',
    added_by VARCHAR(64) DEFAULT 'system' COMMENT 'Who added this record',
    notes TEXT DEFAULT NULL COMMENT 'Optional notes about the donation',
    FOREIGN KEY (steamid) REFERENCES sakaDonate_users(steamid) ON DELETE CASCADE,
    INDEX idx_steamid (steamid),
    INDEX idx_donation_date (donation_date),
    INDEX idx_amount (amount)
) COLLATE = utf8mb4_general_ci COMMENT = 'Individual donation records for each user';

-- Step 4: Create view for easy donation summary queries
CREATE VIEW dodgeball.v_donation_summary AS
SELECT 
    u.steamid,
    u.display_name,
    u.tier,
    u.show_on_website,
    u.expiry_date,
    u.added_date as user_added_date,
    u.added_by as user_added_by,
    COALESCE(SUM(d.amount), 0) as total_amount,
    COUNT(d.id) as donation_count,
    MIN(d.donation_date) as first_donation_date,
    MAX(d.donation_date) as last_donation_date
FROM dodgeball.sakaDonate_users u
LEFT JOIN dodgeball.sakaDonate_donations d ON u.steamid = d.steamid
GROUP BY u.steamid, u.display_name, u.tier, u.show_on_website, u.expiry_date, u.added_date, u.added_by;

-- Step 5: Verify the changes
-- Run this to check the updated table structure
DESCRIBE dodgeball.sakaDonate_users;
DESCRIBE dodgeball.sakaDonate_donations;

-- Run this to test the view
SELECT * FROM dodgeball.v_donation_summary LIMIT 5;
