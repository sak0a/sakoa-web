CREATE TABLE IF NOT EXISTS player_login_states (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  address_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at BIGINT NOT NULL,
  INDEX idx_player_login_address (address_hash, expires_at),
  INDEX idx_player_login_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  steam64 VARCHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  csrf_token CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at BIGINT NOT NULL,
  INDEX idx_player_session_expiry (expires_at)
) ENGINE=InnoDB;
