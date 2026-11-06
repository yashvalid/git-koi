import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateKoiSvg } from '../src/generator.js';
import { fetchGitHubStats } from '../src/github.js';
import { KOI_THEMES } from '../src/themes.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for local experimentation
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Live Dynamic SVG Endpoint (mimics how GitHub Camo or README loads it)
  if (pathname === '/api/koi.svg' || pathname === '/koi.svg') {
    try {
      const username = parsedUrl.searchParams.get('username') || '';
      const theme = parsedUrl.searchParams.get('theme') || null;
      const showStats = parsedUrl.searchParams.get('stats') !== 'false';
      const showLilypads = parsedUrl.searchParams.get('lilypads') !== 'false';

      let stats;
      const commitsToday = parsedUrl.searchParams.get('commitsToday');
      const commitsThisMonth = parsedUrl.searchParams.get('commitsThisMonth');
      const streak = parsedUrl.searchParams.get('streak');

      if (commitsToday !== null || commitsThisMonth !== null || streak !== null) {
        // Manual override from UI sliders
        const todayVal = parseInt(commitsToday ?? '3', 10);
        const monthVal = parseInt(commitsThisMonth ?? '65', 10);
        const streakVal = parseInt(streak ?? '6', 10);

        stats = {
          username: username || 'Koi Explorer',
          commitsToday: isNaN(todayVal) ? 3 : todayVal,
          commitsThisWeek: Math.min(monthVal, (isNaN(todayVal) ? 3 : todayVal) * 5),
          commitsThisMonth: isNaN(monthVal) ? 65 : monthVal,
          commitsTotal: (isNaN(monthVal) ? 65 : monthVal) * 5,
          streak: isNaN(streakVal) ? 6 : streakVal
        };
      } else if (username) {
        stats = await fetchGitHubStats(username);
      } else {
        stats = {
          username: 'Demo User',
          commitsToday: 4,
          commitsThisWeek: 22,
          commitsThisMonth: 85,
          commitsTotal: 520,
          streak: 9
        };
      }

      const svg = generateKoiSvg({
        stats,
        theme: theme && KOI_THEMES[theme] ? theme : null,
        showStats,
        showLilypads
      });

      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(svg);
    } catch (err) {
      console.error('[server] Error generating SVG:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error generating Koi SVG: ' + err.message);
    }
    return;
  }

  // 2. Fetch User Stats JSON Endpoint
  if (pathname === '/api/stats') {
    const username = parsedUrl.searchParams.get('username');
    if (!username) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Username required' }));
      return;
    }
    try {
      const stats = await fetchGitHubStats(username);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. Serve Frontend Interactive Playground
  if (pathname === '/' || pathname === '/index.html') {
    const htmlPath = join(__dirname, 'index.html');
    if (existsSync(htmlPath)) {
      const html = readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
      return;
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🌊 Koi Pond Preview Server running at: http://localhost:${PORT}`);
  console.log(`🎏 Test dynamic SVG directly at: http://localhost:${PORT}/api/koi.svg\n`);
});
