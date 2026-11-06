/**
 * Koi Breeds & Color Palettes
 * Inspired by traditional Japanese Nishikigoi varieties and modern themes.
 */

export const KOI_THEMES = {
  kohaku: {
    name: 'Kohaku (紅白)',
    description: 'Iconic white body with vivid scarlet-red patches',
    bodyBase: '#F6F5F2',
    bodyShadow: '#D2CEC4',
    bodyHighlight: '#FFFFFF',
    patternColor: '#E63926',
    patternAccent: '#C92A1A',
    patternAlt: null,
    finColor: 'rgba(255, 255, 255, 0.75)',
    finStroke: '#E8E4DA',
    eyeColor: '#1A1A1A',
    eyeRing: '#D4AF37',
    glowColor: 'rgba(230, 57, 38, 0.25)',
    pondTheme: 'zen'
  },
  ogon: {
    name: 'Yamabuki Ogon (山吹黄金)',
    description: 'Lustrous metallic pure golden koi of prosperity',
    bodyBase: '#FDB813',
    bodyShadow: '#C88600',
    bodyHighlight: '#FFE484',
    patternColor: '#E69500',
    patternAccent: '#FFC83B',
    patternAlt: '#FFF275',
    finColor: 'rgba(254, 218, 106, 0.8)',
    finStroke: '#DDA012',
    eyeColor: '#2B1704',
    eyeRing: '#FFF099',
    glowColor: 'rgba(253, 184, 19, 0.35)',
    pondTheme: 'gold'
  },
  sanke: {
    name: 'Taisho Sanke (大正三色)',
    description: 'Snow white with fiery vermilion and sumi ink-black accents',
    bodyBase: '#FAFAF7',
    bodyShadow: '#CFCCC4',
    bodyHighlight: '#FFFFFF',
    patternColor: '#E63926',
    patternAccent: '#1F2421',
    patternAlt: '#111413',
    finColor: 'rgba(255, 255, 255, 0.75)',
    finStroke: '#CCC7BC',
    eyeColor: '#1A1A1A',
    eyeRing: '#D4AF37',
    glowColor: 'rgba(230, 57, 38, 0.2)',
    pondTheme: 'zen'
  },
  showa: {
    name: 'Showa Sanshoku (昭和三色)',
    description: 'Jet black sumi base with striking crimson and pure white patterns',
    bodyBase: '#1D2124',
    bodyShadow: '#101315',
    bodyHighlight: '#343B40',
    patternColor: '#D62828',
    patternAccent: '#F5F5F0',
    patternAlt: '#E83E2D',
    finColor: 'rgba(35, 41, 46, 0.85)',
    finStroke: '#444C52',
    eyeColor: '#0A0A0A',
    eyeRing: '#E63926',
    glowColor: 'rgba(214, 40, 40, 0.3)',
    pondTheme: 'midnight'
  },
  tancho: {
    name: 'Tancho (丹頂)',
    description: 'Pure snow white with an iconic solitary crimson crown on the head',
    bodyBase: '#FAF9F6',
    bodyShadow: '#DBD7CD',
    bodyHighlight: '#FFFFFF',
    patternColor: '#D90429',
    patternAccent: '#A0031E',
    patternAlt: null,
    finColor: 'rgba(255, 255, 255, 0.8)',
    finStroke: '#DBD6C9',
    eyeColor: '#1A1A1A',
    eyeRing: '#B89728',
    glowColor: 'rgba(217, 4, 41, 0.25)',
    pondTheme: 'zen'
  },
  asagi: {
    name: 'Asagi (浅黄)',
    description: 'Steel indigo-blue reticulated net scales with fiery rust-red underbelly',
    bodyBase: '#4A6B82',
    bodyShadow: '#2C4353',
    bodyHighlight: '#7A9EB8',
    patternColor: '#D94826',
    patternAccent: '#335065',
    patternAlt: '#E26D46',
    finColor: 'rgba(217, 72, 38, 0.65)',
    finStroke: '#2D4454',
    eyeColor: '#141E24',
    eyeRing: '#8AB3CF',
    glowColor: 'rgba(74, 107, 130, 0.3)',
    pondTheme: 'deepwater'
  },
  neon: {
    name: 'Cyberpunk Neon (電脳鯉)',
    description: 'Bioluminescent synthwave neon glow for futuristic coders',
    bodyBase: '#0F172A',
    bodyShadow: '#050B14',
    bodyHighlight: '#1E293B',
    patternColor: '#06B6D4',
    patternAccent: '#F43F5E',
    patternAlt: '#A855F7',
    finColor: 'rgba(6, 182, 212, 0.55)',
    finStroke: '#38BDF8',
    eyeColor: '#00F0FF',
    eyeRing: '#F43F5E',
    glowColor: 'rgba(6, 182, 212, 0.5)',
    pondTheme: 'cyber'
  }
};

/**
 * Determine Koi attributes based on commit metrics:
 * @param {Object} stats
 * @param {number} stats.commitsToday - commits made today
 * @param {number} stats.commitsThisWeek - commits in the past 7 days
 * @param {number} stats.commitsThisMonth - commits in the past 30 days
 * @param {number} stats.commitsTotal - total commits or yearly commits
 * @param {number} stats.streak - current consecutive active days
 * @param {string} [stats.forcedTheme] - user-specified theme override
 */
export function determineKoiState(stats = {}) {
  const {
    commitsToday = 0,
    commitsThisWeek = 0,
    commitsThisMonth = 0,
    commitsTotal = 0,
    streak = 0,
    forcedTheme = null
  } = stats;

  // 1. Calculate Growth Stage & Size Scale (from 0.72 up to 1.35)
  // Monthly commits drive growth tier
  let stageName = 'Fry (稚魚)';
  let scale = 0.75;
  let finFlow = 0.85;

  if (commitsThisMonth >= 200 || commitsTotal >= 1000) {
    stageName = 'Grand Champion (大錦鯉)';
    scale = 1.32;
    finFlow = 1.35;
  } else if (commitsThisMonth >= 100 || commitsTotal >= 500) {
    stageName = 'Elder Koi (古法錦鯉)';
    scale = 1.20;
    finFlow = 1.2;
  } else if (commitsThisMonth >= 40 || commitsTotal >= 150) {
    stageName = 'Adult Koi (若鯉)';
    scale = 1.05;
    finFlow = 1.05;
  } else if (commitsThisMonth >= 15 || commitsTotal >= 40) {
    stageName = 'Juvenile (当歳)';
    scale = 0.92;
    finFlow = 0.95;
  } else {
    stageName = 'Fingerling (毛子)';
    scale = 0.80;
    finFlow = 0.85;
  }

  // 2. Determine Theme / Breed
  let selectedThemeKey = 'kohaku';
  if (forcedTheme && KOI_THEMES[forcedTheme]) {
    selectedThemeKey = forcedTheme;
  } else {
    // Evolve breed based on streak, volume, and today's activity:
    if (streak >= 14 || commitsThisMonth >= 180) {
      selectedThemeKey = 'ogon'; // Rare Golden Ogon for high streak masters!
    } else if (streak >= 7) {
      selectedThemeKey = 'tancho'; // Sacred Tancho for daily unbroken streaks
    } else if (commitsThisWeek >= 30) {
      selectedThemeKey = 'sanke'; // Taisho Sanke for high weekly variety
    } else if (commitsToday > 0 && commitsThisMonth >= 50) {
      selectedThemeKey = 'kohaku'; // Classic lively Kohaku
    } else if (commitsThisMonth < 15 && commitsToday === 0) {
      selectedThemeKey = 'asagi'; // Cool, patient Asagi in deep contemplation
    } else {
      selectedThemeKey = 'showa'; // Midnight Showa
    }
  }

  const theme = KOI_THEMES[selectedThemeKey];

  // 3. Swimming Dynamics (Speed, tail cadence, ripple intensity)
  // Active commits today make the koi swim with lively energy;
  // Dormant periods let it glide with meditative tranquility.
  let swimDuration = 18; // seconds per lap
  let tailWiggleDuration = 1.2; // seconds per oscillation
  let finFlapDuration = 1.8;
  let rippleInterval = 2.4;
  let energyLevel = 'Peaceful';

  if (commitsToday >= 5) {
    swimDuration = 11;
    tailWiggleDuration = 0.7;
    finFlapDuration = 1.0;
    rippleInterval = 1.2;
    energyLevel = 'Ascending';
  } else if (commitsToday >= 1) {
    swimDuration = 14;
    tailWiggleDuration = 0.9;
    finFlapDuration = 1.3;
    rippleInterval = 1.6;
    energyLevel = 'Active';
  } else if (commitsThisWeek >= 10) {
    swimDuration = 17;
    tailWiggleDuration = 1.2;
    finFlapDuration = 1.8;
    rippleInterval = 2.2;
    energyLevel = 'Cruising';
  } else {
    swimDuration = 22;
    tailWiggleDuration = 1.6;
    finFlapDuration = 2.4;
    rippleInterval = 3.0;
    energyLevel = 'Meditating';
  }

  return {
    themeKey: selectedThemeKey,
    theme,
    stageName,
    scale: parseFloat(scale.toFixed(2)),
    finFlow: parseFloat(finFlow.toFixed(2)),
    swimDuration,
    tailWiggleDuration,
    finFlapDuration,
    rippleInterval,
    energyLevel,
    stats: {
      commitsToday,
      commitsThisWeek,
      commitsThisMonth,
      commitsTotal,
      streak
    }
  };
}
