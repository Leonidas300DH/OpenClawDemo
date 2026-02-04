// Stateless data store for Vercel deployment
// For production, this should be replaced with a proper database (Vercel KV, Supabase, etc.)

// Initial demo data
let feedsData = {
  feeds: [
    {
      id: "feed_c8ae1b3a87f62e602e20366c06366574",
      url: "https://anchor.fm/s/fb856aa0/podcast/rss",
      title: "AI Odyssey",
      description: "AI Odyssey is your journey through the vast and evolving world of artificial intelligence.",
      image: null,
      lastFetchedAt: "2026-02-04T00:00:30.183Z",
      episodes: [
        {
          episodeId: "999ecd09-dab3-4c97-9fd6-57ef2611883a",
          guid: "999ecd09-dab3-4c97-9fd6-57ef2611883a",
          title: "🎧 OpenClaw: The Lobster That Wants to Run Your Life",
          pubDate: "Sat, 31 Jan 2026 23:50:39 GMT",
          description: "<p>Remember when Siri was supposed to change everything? This might actually be it.</p>",
          duration: "799",
          image: null,
          audioUrl: "https://anchor.fm/s/fb856aa0/podcast/play/114840872/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2026-0-31%2F57f9f9ba-8f11-dcec-5448-26075f1b6017.m4a"
        }
      ]
    }
  ]
};

let tagsData = {
  tagsByEpisodeId: {
    "999ecd09-dab3-4c97-9fd6-57ef2611883a": ["AI", "OpenClaw", "Assistant"]
  }
};

/**
 * Get feeds data (simulating file read)
 * @returns {Promise<object>}
 */
export async function getFeeds() {
  return JSON.parse(JSON.stringify(feedsData)); // Deep clone to avoid mutations
}

/**
 * Save feeds data (simulating file write)
 * @param {object} data 
 * @returns {Promise<void>}
 */
export async function saveFeeds(data) {
  feedsData = JSON.parse(JSON.stringify(data)); // Deep clone
  console.log('📝 Feeds updated in memory (would persist in real DB)');
}

/**
 * Get tags data (simulating file read)
 * @returns {Promise<object>}
 */
export async function getTags() {
  return JSON.parse(JSON.stringify(tagsData)); // Deep clone to avoid mutations
}

/**
 * Save tags data (simulating file write)
 * @param {object} data 
 * @returns {Promise<void>}
 */
export async function saveTags(data) {
  tagsData = JSON.parse(JSON.stringify(data)); // Deep clone
  console.log('📝 Tags updated in memory (would persist in real DB)');
}

/**
 * Initialize with empty data if needed
 * @returns {Promise<void>}
 */
export async function initializeData() {
  if (!feedsData.feeds) {
    feedsData = { feeds: [] };
  }
  if (!tagsData.tagsByEpisodeId) {
    tagsData = { tagsByEpisodeId: {} };
  }
}