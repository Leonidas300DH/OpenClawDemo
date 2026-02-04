import { getFeeds, getTags, initializeData } from './_utils/dataStore.js';

// Initialize data on cold start
await initializeData();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `HTTP method ${req.method} is not supported on this endpoint`
    });
    return;
  }

  try {
    const { podcastId, q, tag } = req.query;
    
    const feedsData = await getFeeds();
    const tagsData = await getTags();
    
    let allEpisodes = [];
    
    // Aggregate all episodes from all feeds
    feedsData.feeds.forEach(feed => {
      const feedEpisodes = feed.episodes.map(episode => ({
        episodeId: episode.episodeId,
        podcastId: feed.id,
        podcastTitle: feed.title,
        podcastImage: feed.image,
        episodeTitle: episode.title,
        episodeImage: episode.image,
        pubDate: episode.pubDate,
        duration: episode.duration,
        description: episode.description,
        audioUrl: episode.audioUrl,
        tags: tagsData.tagsByEpisodeId[episode.episodeId] || []
      }));
      
      allEpisodes = allEpisodes.concat(feedEpisodes);
    });
    
    // Apply filters
    if (podcastId) {
      allEpisodes = allEpisodes.filter(ep => ep.podcastId === podcastId);
    }
    
    if (q) {
      const query = q.toLowerCase();
      allEpisodes = allEpisodes.filter(ep => 
        ep.episodeTitle.toLowerCase().includes(query) ||
        ep.podcastTitle.toLowerCase().includes(query) ||
        ep.description.toLowerCase().includes(query)
      );
    }
    
    if (tag) {
      allEpisodes = allEpisodes.filter(ep => 
        ep.tags.includes(tag)
      );
    }
    
    // Sort by date (most recent first)
    allEpisodes.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    res.status(200).json({ episodes: allEpisodes });
    
  } catch (error) {
    console.error('Error in episodes API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}