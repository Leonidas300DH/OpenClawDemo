// Stateless data store for Vercel deployment
// For production, this should be replaced with a proper database (Vercel KV, Supabase, etc.)

import { parseRssFeed } from './rssUtils.js';

// Default RSS feed to auto-fetch
const DEFAULT_RSS_URL = 'https://anchor.fm/s/fb856aa0/podcast/rss';

// Initial empty data - will be auto-populated
let feedsData = {
  feeds: []
};

let tagsData = {
  tagsByEpisodeId: {}
};

/**
 * Get feeds data (simulating file read)
 * @returns {Promise<object>}
 */
export async function getFeeds() {
  // Auto-fetch default RSS feed if no feeds exist
  if (feedsData.feeds.length === 0) {
    try {
      console.log('🔄 No feeds found, auto-fetching default RSS feed...');
      const defaultFeed = await parseRssFeed(DEFAULT_RSS_URL);
      feedsData.feeds.push(defaultFeed);
      console.log(`✅ Auto-fetched "${defaultFeed.title}" with ${defaultFeed.episodes.length} episodes`);
    } catch (error) {
      console.error('❌ Failed to auto-fetch default RSS feed:', error.message);
    }
  }
  
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
  
  // Auto-fetch default RSS feed on initialization if needed
  if (feedsData.feeds.length === 0) {
    try {
      console.log('🚀 Initializing with default RSS feed...');
      const defaultFeed = await parseRssFeed(DEFAULT_RSS_URL);
      feedsData.feeds.push(defaultFeed);
      console.log(`✅ Initialized with "${defaultFeed.title}" - ${defaultFeed.episodes.length} episodes`);
    } catch (error) {
      console.error('❌ Failed to initialize with default RSS feed:', error.message);
    }
  }
}