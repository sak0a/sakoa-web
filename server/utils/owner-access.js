export function isOwnerSteamId(steam64, configured) {
  return typeof steam64 === 'string' && /^7656119\d{10}$/.test(steam64)
    && String(configured || '').split(/[\s,]+/).includes(steam64);
}
