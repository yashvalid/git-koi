/**
 * GitHub Commit Statistics Fetcher
 * Zero external dependencies — uses Node's native fetch.
 */

/**
 * Fetch contribution statistics for a GitHub user.
 * Prioritizes GraphQL API if GITHUB_TOKEN is present, falls back to public Events REST API.
 *
 * @param {string} username - GitHub username
 * @param {string} [token] - GitHub Personal Access Token or GITHUB_TOKEN
 * @returns {Promise<Object>} Commit statistics
 */
export async function fetchGitHubStats(username, token = process.env.GITHUB_TOKEN) {
  if (!username) {
    return getFallbackStats('Demo User');
  }

  // 1. Try GraphQL API if token is provided (standard in GitHub Actions)
  if (token) {
    try {
      const stats = await fetchWithGraphQL(username, token);
      if (stats) return stats;
    } catch (err) {
      console.warn(`[koi] GraphQL fetch failed (${err.message}). Trying public events fallback...`);
    }
  }

  // 2. Try Public REST Events API (no token required, 60 req/hr rate limit)
  try {
    const stats = await fetchWithRestEvents(username);
    if (stats) return stats;
  } catch (err) {
    console.warn(`[koi] Public events fetch failed (${err.message}). Falling back to estimated stats...`);
  }

  return getFallbackStats(username);
}

/**
 * Fetch detailed stats using GitHub's GraphQL API
 */
async function fetchWithGraphQL(username, token) {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
          restrictedContributionsCount
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'koi-github-profile'
    },
    body: JSON.stringify({ query, variables: { login: username } })
  });

  if (!res.ok) {
    throw new Error(`GitHub GraphQL HTTP ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  const collection = json.data?.user?.contributionsCollection;
  if (!collection) {
    throw new Error(`User "${username}" not found or has no contributions`);
  }

  const days = [];
  const weeks = collection.contributionCalendar?.weeks || [];
  for (const week of weeks) {
    for (const day of week.contributionDays || []) {
      days.push(day);
    }
  }

  // Sort by date ascending
  days.sort((a, b) => new Date(a.date) - new Date(b.date));

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let commitsToday = 0;
  let commitsThisWeek = 0;
  let commitsThisMonth = 0;

  for (const day of days) {
    const dayDate = new Date(day.date);
    const count = day.contributionCount || 0;

    if (day.date === todayStr) {
      commitsToday += count;
    }
    if (dayDate >= sevenDaysAgo) {
      commitsThisWeek += count;
    }
    if (dayDate >= thirtyDaysAgo) {
      commitsThisMonth += count;
    }
  }

  // Calculate current streak
  let streak = 0;
  const reversedDays = [...days].reverse();
  let countingStreak = false;

  for (const day of reversedDays) {
    const isToday = day.date === todayStr;
    if (isToday) {
      if (day.contributionCount > 0) {
        streak++;
        countingStreak = true;
      }
      continue;
    }

    if (day.contributionCount > 0) {
      streak++;
      countingStreak = true;
    } else {
      // If we haven't committed today, but did yesterday, streak is still alive
      if (!countingStreak && streak === 0) {
        continue;
      }
      break;
    }
  }

  const commitsTotal = (collection.totalCommitContributions || 0) + (collection.restrictedContributionsCount || 0);

  return {
    username,
    commitsToday,
    commitsThisWeek,
    commitsThisMonth,
    commitsTotal,
    streak
  };
}

/**
 * Fetch recent activity from public Events API (Tokenless fallback)
 */
async function fetchWithRestEvents(username) {
  const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`, {
    headers: {
      'User-Agent': 'koi-github-profile',
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!res.ok) {
    throw new Error(`GitHub REST API HTTP ${res.status}: ${res.statusText}`);
  }

  const events = await res.json();
  if (!Array.isArray(events)) {
    throw new Error('Invalid response from GitHub events API');
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let commitsToday = 0;
  let commitsThisWeek = 0;
  let commitsThisMonth = 0;
  const activeDays = new Set();

  for (const event of events) {
    if (event.type === 'PushEvent' && event.payload && event.payload.commits) {
      const commitCount = event.payload.commits.length || 1;
      const eventDate = new Date(event.created_at);
      const dateStr = eventDate.toISOString().slice(0, 10);

      activeDays.add(dateStr);

      if (dateStr === todayStr) {
        commitsToday += commitCount;
      }
      if (eventDate >= sevenDaysAgo) {
        commitsThisWeek += commitCount;
      }
      if (eventDate >= thirtyDaysAgo) {
        commitsThisMonth += commitCount;
      }
    }
  }

  // Calculate approximate streak from active days
  let streak = 0;
  const checkDate = new Date(now);
  // Check if today has commits; if not, start checking from yesterday
  if (!activeDays.has(checkDate.toISOString().slice(0, 10))) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (activeDays.has(checkDate.toISOString().slice(0, 10))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return {
    username,
    commitsToday,
    commitsThisWeek,
    commitsThisMonth,
    commitsTotal: commitsThisMonth * 4, // estimate yearly
    streak
  };
}

/**
 * Fallback stats when offline or demoing
 */
export function getFallbackStats(username = 'Zen Developer') {
  return {
    username,
    commitsToday: 3,
    commitsThisWeek: 18,
    commitsThisMonth: 64,
    commitsTotal: 480,
    streak: 8
  };
}
