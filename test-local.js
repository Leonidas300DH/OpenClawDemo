#!/usr/bin/env node

/**
 * Simple local test server to verify API structure
 * Run with: node test-local.js
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:3000`);
  
  try {
    if (url.pathname === '/' || url.pathname === '/index.html') {
      // Serve main page
      const html = readFileSync(join(__dirname, 'index.html'), 'utf8');
      res.setHeader('Content-Type', 'text/html');
      res.statusCode = 200;
      res.end(html);
    } else if (url.pathname === '/app.js') {
      // Serve JS file (try public first, fallback to root)
      try {
        const js = readFileSync(join(__dirname, 'public', 'app.js'), 'utf8');
        res.setHeader('Content-Type', 'application/javascript');
        res.statusCode = 200;
        res.end(js);
      } catch {
        const js = readFileSync(join(__dirname, 'app.js'), 'utf8');
        res.setHeader('Content-Type', 'application/javascript');
        res.statusCode = 200;
        res.end(js);
      }
    } else if (url.pathname.startsWith('/api/')) {
      // API routes - simulate what Vercel would do
      if (url.pathname === '/api/feeds') {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({ 
            feeds: [{
              id: 'demo-feed',
              title: 'Demo Podcast',
              description: 'Test podcast for local testing',
              episodeCount: 1
            }]
          }));
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
      } else if (url.pathname === '/api/episodes') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          episodes: [{
            episodeId: 'demo-episode',
            podcastId: 'demo-feed',
            episodeTitle: 'Test Episode',
            podcastTitle: 'Demo Podcast',
            description: 'This is a test episode for local testing',
            tags: ['demo', 'test']
          }]
        }));
      } else if (url.pathname === '/api/tags') {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ 
          tags: ['demo', 'test'],
          tagsByEpisodeId: { 'demo-episode': ['demo', 'test'] }
        }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'API endpoint not found' }));
      }
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Local test server running at http://localhost:${PORT}`);
  console.log('📡 API endpoints available:');
  console.log('  GET  /api/feeds');
  console.log('  GET  /api/episodes');
  console.log('  GET  /api/tags');
  console.log('\n✅ Ready to test the frontend!');
});