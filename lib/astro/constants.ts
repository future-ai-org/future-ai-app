export const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
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
  'aries':       '#ef4444',
  'taurus':      '#22c55e',
  'gemini':      '#facc15',
  'cancer':      '#60a5fa',
  'leo':         '#f97316',
  'virgo':       '#a3e635',
  'libra':       '#e879f9',
  'scorpio':     '#7c3aed',
  'sagittarius': '#f59e0b',
  'capricorn':   '#6b7280',
  'aquarius':    '#38bdf8',
  'pisces':      '#c084fc',
};

export const ELEMENT_COLORS = [
  '#ef4444', '#22c55e', '#facc15', '#60a5fa',
  '#f97316', '#a3e635', '#e879f9', '#7c3aed',
  '#f59e0b', '#6b7280', '#38bdf8', '#c084fc',
];
