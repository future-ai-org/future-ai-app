import { SIGNS, SIGN_GLYPHS } from './constants';

export function signOf(lon: number): number {
  return Math.floor(lon / 30);
}

export function degInSign(lon: number): number {
  return lon % 30;
}

export function formatLon(lon: number): { sign: string; glyph: string; deg: number; min: number; full: string } {
  const s = signOf(lon);
  const d = Math.floor(degInSign(lon));
  const m = Math.floor((degInSign(lon) - d) * 60);
  return {
    sign: SIGNS[s],
    glyph: SIGN_GLYPHS[s],
    deg: d,
    min: m,
    full: `${d}°${m}' ${SIGN_GLYPHS[s]}`,
  };
}
