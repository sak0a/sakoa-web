/**
 * Steam ID conversion utilities
 * Handles conversion between different Steam ID formats
 * Primary format: Steam3 [U:1:XXXXXXX]
 */

/**
 * Convert Steam2 format to Steam3 format
 * STEAM_0:X:XXXXXXX -> [U:1:XXXXXXX]
 */
export function steam2ToSteam3(steam2) {
  if (!steam2 || typeof steam2 !== 'string') {
    return null;
  }

  // Check if it's already Steam3 format
  if (steam2.startsWith('[U:1:') && steam2.endsWith(']')) {
    return steam2;
  }

  // Parse Steam2 format: STEAM_0:X:XXXXXXX
  const steam2Match = steam2.match(/^STEAM_0:([01]):(\d+)$/);
  if (!steam2Match) {
    return null;
  }

  const authServer = parseInt(steam2Match[1]);
  const accountNumber = parseInt(steam2Match[2]);

  // Calculate account ID: accountNumber * 2 + authServer
  const accountId = accountNumber * 2 + authServer;

  return `[U:1:${accountId}]`;
}

/**
 * Convert Steam3 format to Steam2 format
 * [U:1:XXXXXXX] -> STEAM_0:X:XXXXXXX
 */
export function steam3ToSteam2(steam3) {
  if (!steam3 || typeof steam3 !== 'string') {
    return null;
  }

  // Check if it's already Steam2 format
  if (steam3.startsWith('STEAM_0:')) {
    return steam3;
  }

  // Parse Steam3 format: [U:1:XXXXXXX]
  const steam3Match = steam3.match(/^\[U:1:(\d+)\]$/);
  if (!steam3Match) {
    return null;
  }

  const accountId = parseInt(steam3Match[1]);
  const authServer = accountId % 2;
  const accountNumber = Math.floor(accountId / 2);

  return `STEAM_0:${authServer}:${accountNumber}`;
}

/**
 * Normalize Steam ID to Steam3 format
 * Accepts both Steam2 and Steam3 formats, returns Steam3
 */
export function normalizeToSteam3(steamId) {
  if (!steamId || typeof steamId !== 'string') {
    return null;
  }

  // If already Steam3, return as is
  if (steamId.startsWith('[U:1:') && steamId.endsWith(']')) {
    return steamId;
  }

  // If Steam2, convert to Steam3
  if (steamId.startsWith('STEAM_0:')) {
    return steam2ToSteam3(steamId);
  }

  // Unknown format
  return null;
}

/**
 * Validate Steam ID format (accepts both Steam2 and Steam3)
 */
export function isValidSteamId(steamId) {
  if (!steamId || typeof steamId !== 'string') {
    return false;
  }

  // Check Steam3 format: [U:1:XXXXXXX]
  if (/^\[U:1:\d+\]$/.test(steamId)) {
    return true;
  }

  // Check Steam2 format: STEAM_0:X:XXXXXXX
  if (/^STEAM_0:[01]:\d+$/.test(steamId)) {
    return true;
  }

  return false;
}

/**
 * Get account ID from Steam ID (works with both formats)
 */
export function getAccountId(steamId) {
  if (!steamId || typeof steamId !== 'string') {
    return null;
  }

  // Steam3 format: [U:1:XXXXXXX]
  const steam3Match = steamId.match(/^\[U:1:(\d+)\]$/);
  if (steam3Match) {
    return parseInt(steam3Match[1]);
  }

  // Steam2 format: STEAM_0:X:XXXXXXX
  const steam2Match = steamId.match(/^STEAM_0:([01]):(\d+)$/);
  if (steam2Match) {
    const authServer = parseInt(steam2Match[1]);
    const accountNumber = parseInt(steam2Match[2]);
    return accountNumber * 2 + authServer;
  }

  return null;
}

/**
 * Convert Steam ID for SourcePawn plugin (Steam2 format)
 * The plugin expects Steam2 format internally
 */
export function steamIdForPlugin(steamId) {
  const normalized = normalizeToSteam3(steamId);
  if (!normalized) {
    return null;
  }
  return steam3ToSteam2(normalized);
}

/**
 * Convert Steam ID for website display (Steam3 format)
 * The website uses Steam3 format
 */
export function steamIdForWebsite(steamId) {
  return normalizeToSteam3(steamId);
}

/**
 * Batch convert Steam IDs to Steam3 format
 */
export function batchNormalizeToSteam3(steamIds) {
  if (!Array.isArray(steamIds)) {
    return [];
  }

  return steamIds.map(steamId => ({
    original: steamId,
    normalized: normalizeToSteam3(steamId),
    valid: isValidSteamId(steamId)
  })).filter(result => result.valid && result.normalized);
}

/**
 * Format Steam ID for display in admin panel
 */
export function formatSteamIdForDisplay(steamId) {
  if (!steamId) {
    return 'Invalid Steam ID';
  }

  const normalized = normalizeToSteam3(steamId);
  if (!normalized) {
    return `Invalid: ${steamId}`;
  }

  const accountId = getAccountId(normalized);
  return `${normalized} (ID: ${accountId})`;
}

/**
 * Main validation function for admin forms
 */
export function validateAndConvertSteamID(input) {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      steamId: null,
      error: 'Please provide a valid Steam ID'
    };
  }

  const trimmedInput = input.trim();
  const normalized = normalizeToSteam3(trimmedInput);

  if (normalized) {
    return {
      valid: true,
      steamId: normalized,
      error: null
    };
  }

  return {
    valid: false,
    steamId: null,
    error: 'Invalid Steam ID format. Use [U:1:XXXXXXX] or STEAM_0:X:XXXXXXX format.'
  };
}

/**
 * Get example Steam ID formats for user guidance
 */
export function getSteamIDExamples() {
  return {
    steam3: '[U:1:39735273]',
    steam2: 'STEAM_0:1:19867636'
  };
}
