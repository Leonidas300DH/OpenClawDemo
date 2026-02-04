import { getTags, saveTags, initializeData } from './_utils/dataStore.js';

// Initialize data on cold start
await initializeData();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      // Get all tags
      const data = await getTags();
      
      // Get unique tags from all episodes
      const allTags = new Set();
      Object.values(data.tagsByEpisodeId).forEach(episodeTags => {
        episodeTags.forEach(tag => allTags.add(tag));
      });
      
      res.status(200).json({ 
        tags: Array.from(allTags).sort(),
        tagsByEpisodeId: data.tagsByEpisodeId
      });
      
    } else if (req.method === 'PUT') {
      // Update tags for an episode
      const { episodeId, tags } = req.body;
      
      if (!episodeId) {
        return res.status(400).json({ 
          error: 'Episode ID is required',
          message: 'Please provide an episode ID' 
        });
      }
      
      if (!Array.isArray(tags)) {
        return res.status(400).json({ 
          error: 'Invalid tags format',
          message: 'Tags must be an array of strings' 
        });
      }
      
      const data = await getTags();
      
      // Update tags for the episode
      if (tags.length === 0) {
        delete data.tagsByEpisodeId[episodeId];
      } else {
        data.tagsByEpisodeId[episodeId] = tags;
      }
      
      await saveTags(data);
      
      res.status(200).json({ 
        message: 'Tags updated successfully',
        episodeId: episodeId,
        tags: tags
      });
      
    } else {
      res.status(405).json({ 
        error: 'Method not allowed',
        message: `HTTP method ${req.method} is not supported on this endpoint`
      });
    }
    
  } catch (error) {
    console.error('Error in tags API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}