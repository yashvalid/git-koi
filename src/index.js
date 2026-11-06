#!/usr/bin/env node
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generateKoiSvg } from './generator.js';
import { fetchGitHubStats } from './github.js';
import { KOI_THEMES } from './themes.js';

function printHelp() {
  console.log(`
Koi Fish GitHub Profile Generator
Generates an animated living Koi pond SVG driven by your commit activity.

Usage:
  node src/index.js [options]

Options:
  -u, --username <string>      GitHub username to fetch stats for
  -o, --output <path>          Output file path (default: "koi.svg")
  -t, --theme <name>           Force a koi breed/theme:
                               [${Object.keys(KOI_THEMES).join(', ')}]
                               (Default: auto-evolves with commits)
  --token <token>              GitHub token (defaults to GITHUB_TOKEN env var)
  --commits-today <number>     Manual override for commits today
  --commits-month <number>     Manual override for commits this month
  --streak <number>            Manual override for active streak in days
  --no-stats                   Hide the zen statistics card
  --no-lilypads                Hide the floating lily pads
  -h, --help                   Display this help message

Examples:
  node src/index.js -u octocat -o koi.svg
  node src/index.js -u octocat -t ogon
  node src/index.js --commits-month 120 --streak 14 -o champion.svg
`);
}

function parseArgs(args) {
  const options = {
    username: process.env.GITHUB_REPOSITORY_OWNER || process.env.GITHUB_ACTOR || '',
    output: 'koi.svg',
    theme: null,
    token: process.env.GITHUB_TOKEN || '',
    showStats: true,
    showLilypads: true,
    manualStats: {}
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-u' || arg === '--username') {
      options.username = args[++i];
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-t' || arg === '--theme') {
      options.theme = args[++i];
    } else if (arg === '--token') {
      options.token = args[++i];
    } else if (arg === '--commits-today') {
      options.manualStats.commitsToday = parseInt(args[++i], 10);
    } else if (arg === '--commits-week') {
      options.manualStats.commitsThisWeek = parseInt(args[++i], 10);
    } else if (arg === '--commits-month') {
      options.manualStats.commitsThisMonth = parseInt(args[++i], 10);
    } else if (arg === '--streak') {
      options.manualStats.streak = parseInt(args[++i], 10);
    } else if (arg === '--no-stats') {
      options.showStats = false;
    } else if (arg === '--no-lilypads') {
      options.showLilypads = false;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log('🐟 Summoning Koi to the pond...');

  let stats;
  if (Object.keys(options.manualStats).length > 0) {
    stats = {
      username: options.username || 'Manual Preview',
      commitsToday: options.manualStats.commitsToday ?? 2,
      commitsThisWeek: options.manualStats.commitsThisWeek ?? 15,
      commitsThisMonth: options.manualStats.commitsThisMonth ?? 60,
      commitsTotal: (options.manualStats.commitsThisMonth ?? 60) * 4,
      streak: options.manualStats.streak ?? 5
    };
    console.log(`[koi] Using manual stats: ${stats.commitsThisMonth} commits this month, ${stats.streak}d streak`);
  } else {
    stats = await fetchGitHubStats(options.username, options.token);
    console.log(`[koi] Fetched stats for ${stats.username}:`);
    console.log(`      Today: ${stats.commitsToday} | Month: ${stats.commitsThisMonth} | Streak: ${stats.streak} days`);
  }

  const svg = generateKoiSvg({
    stats,
    theme: options.theme,
    showStats: options.showStats,
    showLilypads: options.showLilypads
  });

  const outputPath = resolve(process.cwd(), options.output);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, svg, 'utf-8');

  console.log(`✨ Koi animation successfully generated at: ${outputPath}`);
}

main().catch(err => {
  console.error('❌ Error generating koi animation:', err);
  process.exit(1);
});
