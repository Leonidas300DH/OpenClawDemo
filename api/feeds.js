import { getFeeds, saveFeeds, initializeData } from './_utils/dataStore.js';
import { parseRssFeed } from './_utils/rssUtils.js';

// Initialize data on cold start
await initializeData();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all feeds
      const data = await getFeeds();
      const feedsWithStats = data.feeds.map(feed => ({
        id: feed.id,
        url: feed.url,
        title: feed.title,
        description: feed.description,
        image: feed.image,
        lastFetchedAt: feed.lastFetchedAt,
        episodeCount: feed.episodes.length
      }));
      
      res.status(200).json({ feeds: feedsWithStats });
      
    } else if (req.method === 'POST') {
      // Add new feed
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ 
          error: 'URL is required',
          message: 'Please provide a valid RSS feed URL' 
        });
      }
      
      // Basic URL validation
      try {
        new URL(url);
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid URL',
          message: 'Please provide a valid HTTP/HTTPS URL' 
        });
      }
      
      const data = await getFeeds();
      
      // Check if feed already exists
      const existingFeed = data.feeds.find(feed => feed.url === url);
      if (existingFeed) {
        return res.status(409).json({ 
          error: 'Feed already exists',
          message: 'This RSS feed has already been added',
          feed: existingFeed
        });
      }
      
      // Parse RSS feed
      const newFeed = await parseRssFeed(url);
      
      // Add to feeds
      data.feeds.push(newFeed);
      await saveFeeds(data);
      
      res.status(201).json({ 
        message: 'Feed added successfully',
        feed: newFeed
      });
      
    } else {
      res.status(405).json({ 
        error: 'Method not allowed',
        message: `HTTP method ${req.method} is not supported on this endpoint`
      });
    }
    
  } catch (error) {
    console.error('Error in feeds API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}