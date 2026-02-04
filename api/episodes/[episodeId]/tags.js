import { getTags, saveTags, initializeData } from '../../_utils/dataStore.js';

// Initialize data on cold start
await initializeData();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    res.status(405).json({ 
      error: 'Method not allowed',
      message: `HTTP method ${req.method} is not supported on this endpoint`
    });
    return;
  }

  try {
    const { episodeId } = req.query;
    const { tags } = req.body;
    
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
    
  } catch (error) {
    console.error('Error in episode tags API:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}