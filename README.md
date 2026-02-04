# Podcast Dashboard - Vercel Deployment

A modern podcast RSS feed aggregator and manager built with vanilla JavaScript and deployed on Vercel serverless functions.

## Features

- 📡 Add and manage multiple RSS feeds
- 🎧 Browse episodes with search and filtering
- 🏷️ Tag episodes for better organization
- 📱 Responsive design with Tailwind CSS
- ⚡ Serverless architecture optimized for Vercel

## Architecture

This application has been adapted for Vercel deployment with the following structure:

### Frontend
- `index.html` - Main application page
- `app.js` - Frontend JavaScript logic
- Hosted statically by Vercel

### Backend (Serverless Functions)
- `api/feeds.js` - GET/POST feeds management
- `api/episodes.js` - GET episodes with filtering
- `api/tags.js` - GET all tags
- `api/episodes/[episodeId]/tags.js` - PUT episode tags
- `api/_utils/` - Shared utilities

### Data Persistence

⚠️ **Important**: This demo uses in-memory storage which resets on each deployment. For production, integrate with:
- Vercel KV (Redis)
- Supabase (PostgreSQL)  
- PlanetScale (MySQL)
- Any external database

## Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
# From the project root
npm install
vercel --prod
```

### 3. Environment Setup
No environment variables needed for the demo version.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
vercel dev
```

Visit `http://localhost:3000` to see the application.

## API Endpoints

- `GET /api/feeds` - Get all feeds
- `POST /api/feeds` - Add new feed
- `GET /api/episodes` - Get episodes (with filtering)
- `GET /api/tags` - Get all available tags
- `PUT /api/episodes/[episodeId]/tags` - Update episode tags

## Demo RSS Feed

Try adding this RSS feed to test the application:
```
https://anchor.fm/s/fb856aa0/podcast/rss
```

## Production Considerations

1. **Replace in-memory storage** with a persistent database
2. **Add rate limiting** for API endpoints
3. **Implement caching** for RSS feed parsing
4. **Add user authentication** if needed
5. **Optimize image handling** for podcast artwork

## Technology Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS, Font Awesome
- **Backend**: Node.js serverless functions (Vercel)
- **RSS Parsing**: rss-parser library
- **Deployment**: Vercel

## License

MIT License - feel free to use and modify as needed.