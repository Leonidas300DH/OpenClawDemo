import Parser from 'rss-parser';
import crypto from 'crypto';

const parser = new Parser({
  customFields: {
    feed: ['itunes:image', 'image'],
    item: ['itunes:duration', 'itunes:image', 'itunes:keywords']
  }
});

/**
 * Generate a stable episode ID from feed URL, title, and pub date
 * @param {string} feedUrl 
 * @param {string} title 
 * @param {string} pubDate 
 * @returns {string}
 */
export function generateEpisodeId(feedUrl, title, pubDate) {
  const content = `${feedUrl}|${title}|${pubDate}`;
  return 'ep_' + crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Generate a feed ID from URL
 * @param {string} url 
 * @returns {string}
 */
export function generateFeedId(url) {
  return 'feed_' + crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Extract artwork URL from various RSS fields
 * @param {object} item - RSS item or feed
 * @returns {string|null}
 */
export function extractArtwork(item) {
  // Try itunes:image first
  if (item['itunes:image'] && item['itunes:image'].href) {
    return item['itunes:image'].href;
  }
  
  // Try itunes:image as direct URL (some feeds)
  if (typeof item['itunes:image'] === 'string') {
    return item['itunes:image'];
  }
  
  // Try standard image
  if (item.image) {
    if (typeof item.image === 'string') {
      return item.image;
    }
    if (item.image.url) {
      return item.image.url;
    }
  }
  
  return null;
}

/**
 * Parse duration string to seconds
 * @param {string} duration - Duration in various formats (HH:MM:SS, MM:SS, seconds)
 * @returns {string} Duration in seconds as string
 */
export function parseDuration(duration) {
  if (!duration) return null;
  
  // If it's already just numbers (seconds)
  if (/^\d+$/.test(duration)) {
    return duration;
  }
  
  // Parse HH:MM:SS or MM:SS format
  const parts = duration.split(':').reverse();
  let seconds = 0;
  
  if (parts[0]) seconds += parseInt(parts[0], 10) || 0; // seconds
  if (parts[1]) seconds += (parseInt(parts[1], 10) || 0) * 60; // minutes
  if (parts[2]) seconds += (parseInt(parts[2], 10) || 0) * 3600; // hours
  
  return seconds.toString();
}

/**
 * Format duration seconds to HH:MM:SS
 * @param {string|number} seconds 
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds) return '';
  
  const num = parseInt(seconds, 10);
  const hours = Math.floor(num / 3600);
  const minutes = Math.floor((num % 3600) / 60);
  const secs = num % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Parse RSS feed and normalize data
 * @param {string} url - RSS feed URL
 * @returns {Promise<object>} Normalized feed data
 */
export async function parseRssFeed(url) {
  try {
    const feed = await parser.parseURL(url);
    
    const feedId = generateFeedId(url);
    const feedArtwork = extractArtwork(feed);
    
    const episodes = feed.items.map(item => {
      const episodeId = item.guid || generateEpisodeId(url, item.title, item.pubDate);
      const episodeArtwork = extractArtwork(item);
      const duration = parseDuration(item['itunes:duration']);
      
      return {
        episodeId: typeof episodeId === 'object' ? episodeId._ || episodeId.content : episodeId,
        guid: item.guid,
        title: item.title || '',
        pubDate: item.pubDate || new Date().toISOString(),
        description: item.content || item.contentSnippet || item.summary || '',
        duration: duration,
        image: episodeArtwork,
        audioUrl: item.enclosure ? item.enclosure.url : null
      };
    });
    
    return {
      id: feedId,
      url: url,
      title: feed.title || '',
      description: feed.description || '',
      image: feedArtwork,
      lastFetchedAt: new Date().toISOString(),
      episodes: episodes
    };
  } catch (error) {
    throw new Error(`Failed to parse RSS feed: ${error.message}`);
  }
}