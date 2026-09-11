import { describe, expect, it } from 'vitest';
import { previewColor, previewSegments } from './chat-preview.js';

describe('SourceMod chat preview', () => {
  it('reads existing named and RGB/RGBA settings without changing the save whitelist', () => {
    expect(previewColor('{GOLD}')).toBe('#ffd700');
    expect(previewColor('blue')).toBe('#99ccff');
    expect(previewColor('{#AABBCC80}')).toBe('#aabbcc80');
    expect(previewColor('{#AABBCC}')).toBe('#aabbcc');
    expect(previewColor('--n', '#ff4040')).toBe('#ff4040');
    expect(previewColor('{default}')).toBe('#ffffff');
    expect(previewColor('{teamcolor}', '#ffffff', 'blue')).toBe('#99ccff');
  });
  it('preserves individual tag colors and resets instead of stripping all styling', () => {
    expect(previewSegments('{gold}[{RED}ADMIN{gold}]{default}!')).toEqual([
      { text: '[', color: '#ffd700' }, { text: 'ADMIN', color: '#ff4040' },
      { text: ']', color: '#ffd700' }, { text: '!', color: '#ffffff' }
    ]);
    expect(previewSegments('\x07AABBCCVIP\x08DDEEFF80!')).toEqual([
      { text: 'VIP', color: '#aabbcc' }, { text: '!', color: '#ddeeff80' }
    ]);
    expect(previewSegments('--n')).toEqual([]);
  });
});
