export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

// Standard zodiac symbols (Unicode)
export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

// Standard astrological planet symbols (Unicode)
export const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '⛢',
  Neptune: '♆',
  Pluto: '♇',
  // Asteroids and points
  Lilith: '⚸',
  Juno: '⚵',
  Chiron: '⚷',
  'North Node': '☊',
  'South Node': '☋',
  'Lot of Fortune': '⊗',
  'Lot of Spirit': '⊕',
  'Lot of Eros': '♁',
  'Lot of Victory': '⚔',
};

export const SIGN_COLORS: Record<string, string> = {
  'Aries':       '#ef4444',
  'Taurus':      '#22c55e',
  'Gemini':      '#facc15',
  'Cancer':      '#60a5fa',
  'Leo':         '#f97316',
  'Virgo':       '#a3e635',
  'Libra':       '#e879f9',
  'Scorpio':     '#7c3aed',
  'Sagittarius': '#f59e0b',
  'Capricorn':   '#6b7280',
  'Aquarius':    '#38bdf8',
  'Pisces':      '#c084fc',
};

export const ELEMENT_COLORS = [
  '#ef4444', '#22c55e', '#facc15', '#60a5fa',
  '#f97316', '#a3e635', '#e879f9', '#7c3aed',
  '#f59e0b', '#6b7280', '#38bdf8', '#c084fc',
];
