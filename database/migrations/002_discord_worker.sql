-- Discord status worker and canonical game-server persistence.
-- Secrets (especially DISCORD_BOT_TOKEN) intentionally do not belong in these tables.

CREATE TABLE IF NOT EXISTS game_servers (
  id VARCHAR(64) NOT NULL,
  display_name VARCHAR(160) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port SMALLINT UNSIGNED NOT NULL,
  location VARCHAR(160) NOT NULL DEFAULT '',
  connect_url VARCHAR(512) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  coming_soon BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT UNSIGNED NOT NULL DEFAULT 0,
  discord_publish_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by VARCHAR(128) NOT NULL DEFAULT 'migration',
  PRIMARY KEY (id),
  INDEX idx_game_servers_display (enabled, display_order, id),
  INDEX idx_game_servers_discord (discord_publish_enabled, enabled, display_order, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed the current website server once. Subsequent administration owns this row.
INSERT IGNORE INTO game_servers (
  id, display_name, host, port, location, connect_url,
  enabled, coming_soon, display_order, discord_publish_enabled, updated_by
) VALUES (
  'advanced', '𝘴𝘢𝘬𝘢 Dodgeball Server - Public', '37.114.54.74', 27015,
  'Frankfurt', 'steam://connect/37.114.54.74:27015', TRUE, FALSE, 0, TRUE, 'migration'
);

CREATE TABLE IF NOT EXISTS discord_bot_settings (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  publishing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  guild_id VARCHAR(32) NULL,
  status_channel_id VARCHAR(32) NULL,
  update_interval_seconds INT UNSIGNED NOT NULL DEFAULT 60,
  embed_heading VARCHAR(256) NOT NULL DEFAULT 'saka Dodgeball',
  embed_accent_color INT UNSIGNED NOT NULL DEFAULT 9131519,
  content_text VARCHAR(2000) NOT NULL DEFAULT '',
  show_player_names BOOLEAN NOT NULL DEFAULT TRUE,
  revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by VARCHAR(128) NOT NULL DEFAULT 'migration',
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO discord_bot_settings (id) VALUES (1);

CREATE TABLE IF NOT EXISTS discord_bot_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  job_type ENUM('validate_config', 'publish_all', 'publish_one', 'register_commands') NOT NULL,
  status ENUM('queued', 'running', 'completed', 'failed') NOT NULL DEFAULT 'queued',
  payload JSON NULL,
  result JSON NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 3,
  available_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  locked_at DATETIME(6) NULL,
  lock_owner VARCHAR(160) NULL,
  completed_at DATETIME(6) NULL,
  error_category VARCHAR(64) NULL,
  error_message VARCHAR(500) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  created_by VARCHAR(128) NOT NULL DEFAULT 'admin',
  PRIMARY KEY (id),
  INDEX idx_discord_jobs_claim (status, available_at, locked_at, id),
  INDEX idx_discord_jobs_recent (created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS discord_bot_runtime (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  worker_id VARCHAR(160) NULL,
  connection_state VARCHAR(32) NOT NULL DEFAULT 'stopped',
  token_configured BOOLEAN NOT NULL DEFAULT FALSE,
  bot_user_id VARCHAR(32) NULL,
  bot_user_tag VARCHAR(128) NULL,
  heartbeat_at DATETIME(6) NULL,
  loaded_revision BIGINT UNSIGNED NULL,
  commands_registered BOOLEAN NOT NULL DEFAULT FALSE,
  commands_registered_at DATETIME(6) NULL,
  last_validation_at DATETIME(6) NULL,
  last_validation_result JSON NULL,
  last_publish_at DATETIME(6) NULL,
  last_error_at DATETIME(6) NULL,
  last_error_category VARCHAR(64) NULL,
  last_error_message VARCHAR(500) NULL,
  started_at DATETIME(6) NULL,
  stopped_at DATETIME(6) NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  INDEX idx_discord_runtime_heartbeat (heartbeat_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO discord_bot_runtime (id) VALUES (1);

CREATE TABLE IF NOT EXISTS discord_status_messages (
  server_id VARCHAR(64) NOT NULL,
  channel_id VARCHAR(32) NOT NULL,
  message_id VARCHAR(32) NOT NULL,
  content_hash CHAR(64) NOT NULL,
  published_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (server_id),
  UNIQUE INDEX idx_discord_status_message (channel_id, message_id),
  INDEX idx_discord_status_channel (channel_id, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
