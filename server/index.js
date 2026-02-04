import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readJson, writeJsonAtomic } from './utils/fileUtils.js';
import { parseRssFeed, formatDuration } from './utils/rssUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const FEEDS_FILE = path.join(__dirname, 'data', 'feeds.json');
const TAGS_FILE = path.join(__dirname, 'data', 'tags.json');

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Podcast Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Get all feeds
 */
app.get('/api/feeds', async (req, res) => {
  try {
    const data = await readJson(FEEDS_FILE);
    res.json({ 
      feeds: data.feeds.map(feed => ({
        id: feed.id,
        url: feed.url,
        title: feed.title,
        description: feed.description,
        image: feed.image,
        lastFetchedAt: feed.lastFetchedAt,
        episodeCount: feed.episodes.length
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch feeds',
      message: error.message 
    });
  }
});

/**
 * Add new feed
 */
app.post('/api/feeds', async (req, res) => {
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
  
  try {
    const data = await readJson(FEEDS_FILE);
    
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
    await writeJsonAtomic(FEEDS_FILE, data);
    
    res.status(201).json({ 
      message: 'Feed added successfully',
      feed: newFeed
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add feed',
      message: error.message 
    });
  }
});

/**
 * Delete a feed
 */
app.delete('/api/feeds/:feedId', async (req, res) => {
  const { feedId } = req.params;
  
  try {
    const data = await readJson(FEEDS_FILE);
    const feedIndex = data.feeds.findIndex(feed => feed.id === feedId);
    
    if (feedIndex === -1) {
      return res.status(404).json({ 
        error: 'Feed not found',
        message: `Feed with ID ${feedId} not found`
      });
    }
    
    const deletedFeed = data.feeds.splice(feedIndex, 1)[0];
    await writeJsonAtomic(FEEDS_FILE, data);
    
    // Clean up tags for deleted episodes
    const tagsData = await readJson(TAGS_FILE);
    const episodeIds = deletedFeed.episodes.map(ep => ep.episodeId);
    
    episodeIds.forEach(episodeId => {
      delete tagsData.tagsByEpisodeId[episodeId];
    });
    
    await writeJsonAtomic(TAGS_FILE, tagsData);
    
    res.json({ 
      message: 'Feed deleted successfully',
      deletedFeed: deletedFeed
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete feed',
      message: error.message 
    });
  }
});

/**
 * Refresh a feed
 */
app.post('/api/feeds/:feedId/refresh', async (req, res) => {
  const { feedId } = req.params;
  
  try {
    const data = await readJson(FEEDS_FILE);
    const feedIndex = data.feeds.findIndex(feed => feed.id === feedId);
    
    if (feedIndex === -1) {
      return res.status(404).json({ 
        error: 'Feed not found',
        message: `Feed with ID ${feedId} not found`
      });
    }
    
    const existingFeed = data.feeds[feedIndex];
    const updatedFeed = await parseRssFeed(existingFeed.url);
    
    data.feeds[feedIndex] = { ...updatedFeed, id: feedId };
    await writeJsonAtomic(FEEDS_FILE, data);
    
    res.json({ 
      message: 'Feed refreshed successfully',
      feed: data.feeds[feedIndex]
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to refresh feed',
      message: error.message 
    });
  }
});

/**
 * Get all episodes (aggregated from all feeds)
 */
app.get('/api/episodes', async (req, res) => {
  const { podcastId, q, tag } = req.query;
  
  try {
    const feedsData = await readJson(FEEDS_FILE);
    const tagsData = await readJson(TAGS_FILE);
    
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
    
    res.json({ episodes: allEpisodes });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch episodes',
      message: error.message 
    });
  }
});

/**
 * Update tags for an episode
 */
app.put('/api/episodes/:episodeId/tags', async (req, res) => {
  const { episodeId } = req.params;
  const { tags } = req.body;
  
  if (!Array.isArray(tags)) {
    return res.status(400).json({ 
      error: 'Invalid tags format',
      message: 'Tags must be an array of strings' 
    });
  }
  
  try {
    const data = await readJson(TAGS_FILE);
    
    // Update tags for the episode
    if (tags.length === 0) {
      delete data.tagsByEpisodeId[episodeId];
    } else {
      data.tagsByEpisodeId[episodeId] = tags;
    }
    
    await writeJsonAtomic(TAGS_FILE, data);
    
    res.json({ 
      message: 'Tags updated successfully',
      episodeId: episodeId,
      tags: tags
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update tags',
      message: error.message 
    });
  }
});

/**
 * Get all tags
 */
app.get('/api/tags', async (req, res) => {
  try {
    const data = await readJson(TAGS_FILE);
    
    // Get unique tags from all episodes
    const allTags = new Set();
    Object.values(data.tagsByEpisodeId).forEach(episodeTags => {
      episodeTags.forEach(tag => allTags.add(tag));
    });
    
    res.json({ 
      tags: Array.from(allTags).sort(),
      tagsByEpisodeId: data.tagsByEpisodeId
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch tags',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Podcast Dashboard Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});