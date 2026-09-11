import { sourceColor } from './source-colors.js';

// Reading existing server settings is broader than the named-only website picker.
// SourceMod supports case-insensitive tokens and legacy RRGGBB/RRGGBBAA values.
export function previewColor(value, fallback = '#ffffff', team = 'red') {
  if (typeof value !== 'string') return fallback;
  if (value[0] === '\x07' || value[0] === '\x08') value = `#${value.slice(1)}`;
  if (value === '\x01') value = 'default';
  if (value === '\x03') value = 'teamcolor';
  const token = value.trim().replace(/^\{([^{}]+)\}$/, '$1').toLowerCase();
  if (token === 'default') return '#ffffff';
  if (token === 'teamcolor') return sourceColor(`{${team}}`)?.hex || '#ff4040';
  if (/^#[a-f0-9]{6}(?:[a-f0-9]{2})?$/.test(token)) return token;
  return sourceColor(`{${token}}`)?.hex || fallback;
}

export function previewSegments(text, fallback = '#ffffff', team = 'red') {
  if (!text || text === '--n') return [];
  const segments = [];
  let color = fallback;
  // Handle both stored multicolors tags and already-expanded Source chat codes.
  // eslint-disable-next-line no-control-regex -- Source chat encodes colors with these control bytes.
  const tokens = /\{([^{}]+)\}|\x07([a-f0-9]{6})|\x08([a-f0-9]{8})|([\x01\x03])/gi;
  let start = 0;
  for (const match of text.matchAll(tokens)) {
    if (match.index > start) segments.push({ text: text.slice(start, match.index), color });
    color = previewColor(match[1] || (match[2] || match[3] ? `#${match[2] || match[3]}` : match[4] === '\x03' ? 'teamcolor' : 'default'), color, team);
    start = match.index + match[0].length;
  }
  if (start < text.length) segments.push({ text: text.slice(start), color });
  return segments;
}
