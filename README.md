# Podcast Dashboard

A modern web application for managing multiple podcast RSS feeds, aggregating episodes, and organizing them with custom tags.

![Podcast Dashboard](https://via.placeholder.com/800x400?text=Podcast+Dashboard)

## Features

- **Multi-RSS Feed Management**: Add, manage, and remove multiple podcast RSS feeds
- **Episode Aggregation**: View all episodes from all feeds in one unified timeline
- **Advanced Filtering**: Filter by podcast, search keywords, or tags
- **Custom Tagging**: Add custom tags to episodes for better organization
- **Responsive Design**: Beautiful, modern UI that works on desktop and mobile
- **Real-time Updates**: Automatically fetch and parse RSS feeds

## Tech Stack

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON files (no database required)
- **RSS Parsing**: rss-parser library

## Quick Start

### Prerequisites

- Node.js (v14 or higher)
- Python 3 (for serving static files)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd podcast-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd server && npm install
   ```

3. **Start the application**
   ```bash
   # From the root directory
   npm run dev
   ```

   This will start both:
   - Backend API server on http://localhost:3001
   - Frontend client on http://localhost:3000

4. **Open your browser**
   
   Navigate to http://localhost:3000 to access the Podcast Dashboard

## Usage

### Adding RSS Feeds

1. Enter a podcast RSS feed URL in the "Add RSS Feed" input
2. Click "Add Feed" to fetch and parse the podcast
3. Episodes will automatically appear in the main feed

### Managing Episodes

- **Search**: Use the search bar to find episodes by title, podcast name, or description
- **Filter by Podcast**: Select a specific podcast from the dropdown
- **Filter by Tags**: Choose tags to show only tagged episodes
- **Expand Description**: Click "Expand" to read full episode descriptions

### Tagging System

1. Click the "Tags" button on any episode card
2. Add custom tags in the modal that opens
3. Use tags to organize episodes by topic, priority, or status
4. Filter episodes by tags using the tag dropdown

## API Endpoints

### Feeds Management
- `GET /api/feeds` - List all feeds
- `POST /api/feeds` - Add new feed
- `DELETE /api/feeds/:feedId` - Delete feed
- `POST /api/feeds/:feedId/refresh` - Refresh feed

### Episodes
- `GET /api/episodes` - Get all episodes (with optional filters)
  - Query params: `podcastId`, `q` (search), `tag`

### Tags
- `GET /api/tags` - Get all tags
- `PUT /api/episodes/:episodeId/tags` - Update episode tags

## Data Storage

The application stores data in JSON files:

- `server/data/feeds.json` - RSS feed metadata and episodes
- `server/data/tags.json` - Episode tag mappings

No database setup required!

## Configuration

### Server Configuration

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 node server/index.js
```

### CORS

The server is configured with CORS enabled for development. For production deployment, update the CORS configuration in `server/index.js`.

## Development

### Project Structure

```
podcast-dashboard/
├── server/                 # Backend Express.js API
│   ├── index.js           # Main server file
│   ├── utils/             # Utility functions
│   │   ├── fileUtils.js   # JSON file operations
│   │   └── rssUtils.js    # RSS parsing utilities
│   ├── data/              # JSON data storage
│   └── package.json       # Server dependencies
├── client/                 # Frontend application
│   ├── index.html         # Main HTML file
│   ├── app.js             # JavaScript application logic
│   └── package.json       # Client configuration
└── package.json           # Root project configuration
```

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `cd server && npm run dev` - Start only the server with auto-reload
- `cd client && npm run dev` - Start only the client server

## Testing

The application has been tested with various RSS feeds. To test with the sample feed:

1. Add this RSS feed: `https://anchor.fm/s/fb856aa0/podcast/rss`
2. Verify episodes appear and can be filtered/tagged
3. Test all functionality including search and tags

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Known Limitations

- Images without proper CORS headers may not display
- Very large RSS feeds may take time to load initially
- HTML content in descriptions is stripped for security

## Future Enhancements

- [ ] Audio player integration
- [ ] Episode bookmarking
- [ ] Export/import feeds
- [ ] Dark mode support
- [ ] Push notifications for new episodes
- [ ] Advanced search with filters

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ for podcast enthusiasts