CREATE TABLE IF NOT EXISTS app_settings (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  payload JSON NOT NULL,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by VARCHAR(128) NOT NULL DEFAULT 'migration',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_fingerprint VARCHAR(128) NOT NULL,
  action VARCHAR(128) NOT NULL,
  target VARCHAR(255) NULL,
  outcome ENUM('success', 'failure', 'denied') NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_admin_audit_created_at (created_at),
  INDEX idx_admin_audit_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the current file-backed configuration once. Admin updates own the row afterward.
INSERT IGNORE INTO app_settings (id, payload, revision, updated_by)
VALUES (
  1,
  JSON_OBJECT(
    'maintenance', JSON_OBJECT(
      'enabled', FALSE,
      'title', 'Maintenance Mode',
      'message', 'We''re currently performing maintenance on our website. Please check back soon!',
      'estimatedTime', '1 Day'
    ),
    'seasons', JSON_OBJECT('startYear', 2025, 'startMonth', 6, 'startDay', 17),
    'discord', JSON_OBJECT('inviteUrl', 'https://discord.gg/JuxYYVEkzc'),
    'donations', JSON_OBJECT(
      'paypalEnabled', TRUE,
      'revolutEnabled', FALSE,
      'buyMeACoffeeEnabled', TRUE
    ),
    'heroStats', JSON_OBJECT(
      'uptime', '24/7',
      'activePlayers', 1243,
      'monthlyDonations', 6,
      'monthlyGoal', 30,
      'autoUpdateDonations', FALSE,
      'autoUpdatePlayers', FALSE
    ),
    'cache', JSON_OBJECT(
      'serverStatusInterval', 30,
      'leaderboardInterval', 10,
      'playerSearchInterval', 10,
      'seasonalLeaderboardInterval', 10,
      'databaseStatusInterval', 5,
      'steamProfilesInterval', 1200
    )
  ),
  1,
  'migration'
);
