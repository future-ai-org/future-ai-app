/**
 * Editable copy for the app. Change strings here to update text across the site.
 */
export const copy = {
  site: {
    title: 'Natal Chart Calculator',
    description:
      'Calculate your Western astrology natal chart with precise planetary positions and Placidus house system.',
    tagline: 'Western Astrology · Placidus Houses · Tropical Zodiac',
  },

  nav: {
    home: 'Home',
    chart: 'Natal Chart',
    ariaLabel: 'Main navigation',
  },

  footer: {
    tagline: 'Western Astrology · Placidus Houses · Tropical Zodiac',
    copyright: '© {year} Natal Chart Calculator. All rights reserved.',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Natal Chart', href: '/chart' },
    ],
  },

  home: {
    heroIcon: '✦',
    title: 'Your Cosmic Blueprint',
    subtitle:
      'Discover your natal chart — the precise map of the sky at the moment you were born.',
    tagline: 'Western Astrology · Placidus Houses · Tropical Zodiac',
    cta: 'Calculate My Chart',
    features: [
      { icon: '☉', label: 'Planetary Positions' },
      { icon: '⌂', label: 'Placidus Houses' },
      { icon: '↑', label: 'Ascendant & MC' },
    ],
  },

  chart: {
    back: '← Back',
    title: 'Natal Chart',
    titlePrefix: '✦',
    tagline: 'Western Astrology · Placidus Houses · Tropical Zodiac',
  },

  form: {
    sectionTitle: 'Birth Data',
    dateLabel: 'Date of Birth',
    timeLabel: 'Time of Birth',
    cityLabel: 'Birth City',
    utcLabel: 'UTC Offset — adjust if DST applies',
    utcPlaceholder: 'e.g. -5 or +1',
    submit: 'Calculate My Chart',
    calculating: 'Calculating…',
    errors: {
      noDate: 'Please enter your birth date.',
      noTime: 'Please enter your birth time.',
      noCity: 'Please search for and select a birth city.',
      invalidUtc: 'Please enter a valid UTC offset.',
    },
  },

  citySearch: {
    placeholder: 'e.g. New York, London, Tokyo',
    search: 'Search',
    searching: 'Searching…',
    foundPrefix: '✓',
  },

  planetTable: {
    title: 'Planets',
    planet: 'Planet',
    sign: 'Sign',
    degree: 'Degree',
    house: 'House',
  },

  ascendant: {
    title: 'Ascendant (Rising Sign)',
    risingSuffix: '— your rising sign',
    mcLabel: 'MC (Midheaven):',
    houseLabel: (n: number) => `House ${n}:`,
  },
} as const;
