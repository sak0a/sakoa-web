// SteamID validation and conversion utilities

/**
 * Validates and converts various SteamID formats to SteamID64
 * Supports: SteamID64, SteamID3, SteamID (legacy format)
 */

// Convert SteamID3 format [U:1:XXXXXXXX] to SteamID64
function steamID3ToSteamID64(steamID3) {
  const match = steamID3.match(/\[U:1:(\d+)\]/);
  if (!match) return null;
  
  const accountID = parseInt(match[1]);
  const steamID64 = (BigInt(accountID) + BigInt('76561197960265728')).toString();
  return steamID64;
}

// Convert legacy SteamID format STEAM_0:Y:Z to SteamID64
function legacySteamIDToSteamID64(steamID) {
  const match = steamID.match(/STEAM_0:([01]):(\d+)/);
  if (!match) return null;
  
  const y = parseInt(match[1]);
  const z = parseInt(match[2]);
  const accountID = (z * 2) + y;
  const steamID64 = (BigInt(accountID) + BigInt('76561197960265728')).toString();
  return steamID64;
}

// Validate SteamID64 format
function isValidSteamID64(steamID64) {
  if (typeof steamID64 !== 'string') return false;

  // SteamID64 should be 17 digits and start with 7656119
  // Valid range is approximately 76561197960265728 to 76561202255233023
  const steamIDRegex = /^7656119[789]\d{9}$/;
  return steamIDRegex.test(steamID64);
}

/**
 * Main function to validate and convert any SteamID format to SteamID64
 * @param {string} input - SteamID in any supported format
 * @returns {object} - { valid: boolean, steamID64: string|null, error: string|null }
 */
export function validateAndConvertSteamID(input) {
  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      steamID64: null,
      error: 'Please provide a valid SteamID'
    };
  }

  const trimmedInput = input.trim();

  // Check if it's already a valid SteamID64
  if (isValidSteamID64(trimmedInput)) {
    return {
      valid: true,
      steamID64: trimmedInput,
      error: null
    };
  }

  // Try SteamID3 format [U:1:XXXXXXXX]
  if (trimmedInput.startsWith('[U:1:') && trimmedInput.endsWith(']')) {
    const steamID64 = steamID3ToSteamID64(trimmedInput);
    if (steamID64 && isValidSteamID64(steamID64)) {
      return {
        valid: true,
        steamID64: steamID64,
        error: null
      };
    }
  }

  // Try legacy SteamID format STEAM_0:Y:Z
  if (trimmedInput.startsWith('STEAM_0:')) {
    const steamID64 = legacySteamIDToSteamID64(trimmedInput);
    if (steamID64 && isValidSteamID64(steamID64)) {
      return {
        valid: true,
        steamID64: steamID64,
        error: null
      };
    }
  }

  // If we get here, the format is not recognized
  return {
    valid: false,
    steamID64: null,
    error: 'Invalid SteamID format. Please use a correct format.'
  };
}

/**
 * Get example SteamID formats for user guidance
 */
export function getSteamIDExamples() {
  return {
    steamID64: '76561198000000001',
    steamID3: '[U:1:39735273]',
    legacy: 'STEAM_0:1:19867636'
  };
}
