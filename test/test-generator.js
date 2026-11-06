import { generateKoiSvg } from '../src/generator.js';
import { KOI_THEMES, determineKoiState } from '../src/themes.js';

console.log('🧪 Starting Koi Generator Test Suite...\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Theme checks
for (const themeKey of Object.keys(KOI_THEMES)) {
  const svg = generateKoiSvg({
    stats: { commitsToday: 5, commitsThisMonth: 60, streak: 7 },
    theme: themeKey
  });

  assert(svg.startsWith('<!-- Koi Fish'), `Generates valid header for theme "${themeKey}"`);
  assert(svg.includes('</svg>'), `Properly closes SVG for theme "${themeKey}"`);
  assert(svg.includes('id="koi-swim-path"'), `Contains swim trajectory for theme "${themeKey}"`);
  // XML only defines 5 entities; a stray "&" or "&nbsp;" makes browsers/GitHub refuse to render the image
  assert(!/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/.test(svg), `No invalid XML entities for theme "${themeKey}"`);
}

// 2. Growth stage and scale scaling tests
const stages = [
  { commits: 5, expectedStage: 'Fingerling (毛子)', maxScale: 0.85 },
  { commits: 25, expectedStage: 'Juvenile (当歳)', maxScale: 0.95 },
  { commits: 80, expectedStage: 'Adult Koi (若鯉)', maxScale: 1.10 },
  { commits: 150, expectedStage: 'Elder Koi (古法錦鯉)', maxScale: 1.25 },
  { commits: 350, expectedStage: 'Grand Champion (大錦鯉)', minScale: 1.30 }
];

for (const stage of stages) {
  const state = determineKoiState({
    commitsToday: 2,
    commitsThisMonth: stage.commits,
    commitsTotal: stage.commits * 3,
    streak: 3
  });

  assert(state.stageName === stage.expectedStage, `Commit tier ${stage.commits} produces stage "${stage.expectedStage}"`);
  if (stage.maxScale) {
    assert(state.scale <= stage.maxScale, `Scale ${state.scale} within max ${stage.maxScale}`);
  }
  if (stage.minScale) {
    assert(state.scale >= stage.minScale, `Scale ${state.scale} >= min ${stage.minScale}`);
  }
}

// 3. Dynamic speed scaling
const slowState = determineKoiState({ commitsToday: 0, commitsThisWeek: 2 });
const fastState = determineKoiState({ commitsToday: 8, commitsThisWeek: 40 });
assert(fastState.swimDuration < slowState.swimDuration, 'Active day swims faster than dormant day');
assert(fastState.tailWiggleDuration < slowState.tailWiggleDuration, 'Active day tail wiggles faster than dormant day');

// 4. Streak unlocks Golden Ogon
const streakState = determineKoiState({ commitsToday: 3, commitsThisMonth: 50, streak: 16 });
assert(streakState.themeKey === 'ogon', '16-day streak unlocks Golden Yamabuki Ogon');

// 5. Hide stats option
const noStatsSvg = generateKoiSvg({ showStats: false });
assert(!noStatsSvg.includes('zen-stats-card'), 'showStats: false removes the zen stats card');

console.log(`\n================================`);
console.log(`Tests: ${passed} passed, ${failed} failed.`);
console.log(`================================\n`);

if (failed > 0) {
  process.exit(1);
}
