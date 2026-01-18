# Stream Finder

A web application for discovering movies and TV shows across Australian streaming platforms including Netflix, Stan, Prime Video, Disney+, Paramount+, Binge, and Max.

![Stream Finder](https://img.shields.io/badge/Platform-Raspberry%20Pi-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-10.1-purple)

## 📋 Version History

### v10.1 (January 2026) - Current
**IMDb Integration Fix**
- ✅ Fixed IMDb links not appearing in detail view
- ✅ Added external_ids API call to fetch IMDb IDs dynamically
- ✅ IMDb button now appears for all content with IMDb entries

### v10.0 (January 2026)
**Major Browse & Search Improvements**
- ✅ **Browse All** now actually browses ALL content (not just cached trending)
- ✅ Browse All uses discover endpoint with proper pagination
- ✅ Search automatically deselects tabs (visual clarity)
- ✅ Clearing search returns to "What's Hot" tab
- ✅ Increased default load: What's Hot and What's New now show 100 items (was 40)
- ✅ What's New expanded to 6 months (was 3 months)
- ✅ Fixed "Load More" button working in all scenarios
- ✅ Genre filtering now useful with larger datasets

### v9.0 (January 2026)
**Bug Fixes & Caching**
- ✅ Fixed duplicate content when filtering by multiple streaming services
- ✅ Fixed incorrect streaming provider data display
- ✅ Added in-memory caching system (1-hour TTL)
- ✅ Added deduplication system across all views
- ✅ Improved provider-centric fetching architecture
- ✅ Better recommendation algorithm (recommendations API → similar API fallback)
- ✅ Performance improvements: ~60% reduction in API calls

### v8.0 (January 2026)
**Text Visibility & Provider Updates**
- ✅ Fixed text visibility on dark backgrounds
- ✅ Changed all text colors for better contrast
- ✅ Removed Australian FTA providers (7plus, 9Now, 10 play, SBS, ABC iview)
- ✅ Added Max (HBO Max)

### v7.0 (January 2026)
**Recommendations & External Links**
- ✅ Better recommendations using TMDB recommendations API
- ✅ Falls back to similar API if no recommendations
- ✅ Increased recommendations from 8 to 12 items
- ✅ Added Rotten Tomatoes search links

### v6.0 (January 2026)
**Detail View & Similar Content**
- ✅ Click any item to see full detail view
- ✅ Full-screen detail modal with back button
- ✅ Shows complete synopsis and metadata
- ✅ Similar titles section with recommendations
- ✅ Year display for all content

### v5.0 (January 2026)
**Browse All Tab**
- ✅ Added "Browse All" tab for exploring all content
- ✅ Load More button for pagination
- ✅ Popular content sorting

### v4.0 (January 2026)
**Content Type Filtering**
- ✅ Filter by Movies, TV Shows, or All
- ✅ Works across all tabs and search

### v3.0 (January 2026)
**Genre Filtering**
- ✅ 14 genre categories (Action, Comedy, Drama, Horror, Sci-Fi, etc.)
- ✅ Multi-select genre filtering
- ✅ Genre filters work with service filters

### v2.0 (January 2026)
**What's New Tab**
- ✅ Shows recent releases from last 3 months
- ✅ Sorted by release date

### v1.0 (January 2026)
**Initial Release**
- ✅ What's Hot tab (trending content)
- ✅ Search functionality
- ✅ Streaming service filtering
- ✅ Australian streaming availability display
- ✅ Netflix, Prime Video, Stan, Paramount+, Disney+, Binge support

---

## Features

- 🔍 **Real-time Search** - Search across movies and TV shows with instant results (20 results)
- 🔥 **What's Hot** - Trending content updated weekly (100 items)
- ✨ **What's New** - Recent releases from the last 6 months (100 items)
- 🎬 **Browse All** - Explore ALL content by popularity with infinite scroll
- 📺 **Streaming Availability** - Shows which Australian platforms have each title
- 🎭 **Genre Filtering** - 14 genre categories with meaningful results
- 🎯 **Service Filtering** - Filter by Netflix, Stan, Prime Video, Disney+, Paramount+, Binge, Max
- 📱 **Content Type Filter** - Toggle between Movies, TV Shows, or All
- 💡 **Smart Recommendations** - AI-powered suggestions based on viewing patterns
- 🔗 **External Links** - Direct access to IMDb and Rotten Tomatoes
- ⚡ **Performance Caching** - In-memory cache reduces API calls (1-hour TTL)
- 🌐 **Mobile Responsive** - Works on all devices
- 🚫 **No Duplicates** - Intelligent deduplication ensures clean results
- 🎨 **Dark Theme** - Easy-to-read text on dark backgrounds

## Tech Stack

- **Frontend**: React 18 (via CDN)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Custom SVG components (Lucide-inspired)
- **API**: The Movie Database (TMDB) API
- **Server**: Nginx (Alpine)
- **Container**: Docker
- **Hosting**: Raspberry Pi with Cloudflare Tunnel

## Prerequisites

- Raspberry Pi (any model with Docker support)
- Docker installed
- Internet connection
- (Optional) Cloudflare account for public hosting
- (Optional) TMDB API key for production use

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/stream-finder.git
cd stream-finder
```

### 2. Build the Docker Image

```bash
docker build -t stream-finder:latest .
```

### 3. Run the Container

```bash
docker run -d \
  --name stream-finder \
  --restart always \
  -p 8080:80 \
  stream-finder:latest
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:8080
```

Or from another device on your network:
```
http://your-pi-ip:8080
```

## File Structure

```
stream-finder/
├── index.html          # Main HTML file with React dependencies
├── app.js              # React application code (v10.1)
├── Dockerfile          # Docker build configuration
├── nginx.conf          # Nginx server configuration
├── README.md           # This file
├── DEPLOYMENT.md       # Detailed deployment guide
├── QUICK_REFERENCE.md  # Quick command reference
└── .gitignore          # Git ignore rules
```

## Configuration

### Changing the Port

To use a different port (e.g., 3000):

```bash
docker run -d \
  --name stream-finder \
  --restart always \
  -p 3000:80 \
  stream-finder:latest
```

### Using Your Own TMDB API Key

1. Get a free API key from [The Movie Database](https://www.themoviedb.org/settings/api)
2. Open `app.js`
3. Replace the `TMDB_API_KEY` constant at the top:
```javascript
const TMDB_API_KEY = 'YOUR_API_KEY_HERE';
```
4. Rebuild the Docker image

## Data Loading Strategy

### What's Hot (Trending)
- **Global View**: 5 pages of trending content (~100 items)
- **Filtered View**: 20 TV + 20 Movies per selected provider (40 items each)
- **Update**: Weekly via TMDB trending API

### What's New (Recent Releases)
- **Global View**: Last 6 months, 100 items
- **Filtered View**: Provider-specific recent content (40 items per provider)
- **Update**: Daily via TMDB discover API

### Browse All
- **Global View**: ALL content sorted by popularity, paginated
- **Filtered View**: Provider-specific content, paginated
- **Update**: Real-time via TMDB discover API

### Search
- **Always**: 20 most relevant results
- **Real-time**: Instant results as you type
- **Contextual**: Respects active filters

## Docker Commands

### View Logs
```bash
docker logs -f stream-finder
```

### Stop Container
```bash
docker stop stream-finder
```

### Start Container
```bash
docker start stream-finder
```

### Restart Container
```bash
docker restart stream-finder
```

### Remove Container
```bash
docker stop stream-finder
docker rm stream-finder
```

### Rebuild After Changes
```bash
docker build -t stream-finder:latest .
docker stop stream-finder
docker rm stream-finder
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

## Deploying with Cloudflare Tunnel

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete Cloudflare Tunnel setup instructions.

## Updating the Application

### Update Content

1. Modify `app.js` or `index.html`
2. Rebuild and restart:

```bash
cd /path/to/stream-finder
docker build -t stream-finder:latest .
docker restart stream-finder
```

### Pull Latest from GitHub

```bash
git pull origin main
docker build -t stream-finder:latest .
docker restart stream-finder
```

### Purge Cloudflare Cache

After updates, always purge Cloudflare cache:
1. Go to Cloudflare Dashboard
2. Caching → Purge Everything
3. Hard refresh browser (Ctrl+Shift+R)

## Troubleshooting

### Container Won't Start

Check logs:
```bash
docker logs stream-finder
```

Verify files exist:
```bash
docker exec stream-finder ls -la /usr/share/nginx/html/
```

### No Content Displayed

1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify API is responding:
```bash
curl "https://api.themoviedb.org/3/trending/all/week?api_key=8265bd1679663a7ea12ac168da84d2e8"
```

### Port Already in Use

Change the port in the `docker run` command:
```bash
docker run -d --name stream-finder --restart always -p 9090:80 stream-finder:latest
```

### API Rate Limiting

If you're getting rate limited:
1. Get your own TMDB API key (free)
2. Replace the API key in `app.js`
3. Rebuild the container

### IMDb Links Not Showing

- IMDb links only appear for content that has an IMDb ID
- Some newer or obscure content may not have IMDb entries
- Rotten Tomatoes search is always available as fallback

### Duplicate Content

Fixed in v9.0 - if you still see duplicates:
1. Ensure you're on v10.1
2. Clear browser cache
3. Purge Cloudflare cache

## Performance Optimization

### Current Optimizations (v10.1)
- In-memory caching with 1-hour TTL
- Deduplication on all data fetches
- Lazy loading of external IDs (IMDb)
- Optimized API calls (multi-page batching)
- Nginx gzip compression enabled

### Monitoring Performance
```bash
# Container resource usage
docker stats stream-finder

# API response times
# Check browser Network tab (F12)
```

## Known Limitations

1. **TMDB API Rate Limits** - 40 requests per 10 seconds (mitigated by caching)
2. **Streaming Data** - Limited to Australian platforms via TMDB data
3. **No User Accounts** - All users see the same content
4. **No Watchlist** - No persistence or saved favorites
5. **Cache Duration** - 1-hour cache may show slightly stale data
6. **IMDb Coverage** - Not all content has IMDb IDs

## Future Enhancements

Potential improvements:
- [ ] IndexedDB for persistent client-side caching
- [ ] User authentication and profiles
- [ ] Watchlist/favorites with persistence
- [ ] Recommendations based on viewing history
- [ ] Email notifications for new releases
- [ ] Dark/light theme toggle
- [ ] More streaming regions
- [ ] Backend API with database (PostgreSQL)
- [ ] GraphQL API layer
- [ ] Mobile app (React Native)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see below for details:

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgments

- [The Movie Database (TMDB)](https://www.themoviedb.org/) for the API
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://react.dev/) for the framework
- [Lucide](https://lucide.dev/) for icon inspiration
- [Nginx](https://nginx.org/) for web serving
- [Docker](https://www.docker.com/) for containerization
- [IMDb](https://www.imdb.com/) for movie/TV data
- [Rotten Tomatoes](https://www.rottentomatoes.com/) for ratings

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## Project Status

**Active Development** - Last updated: January 2026 (v10.1)

## Changelog Summary

| Version | Date | Key Changes |
|---------|------|-------------|
| v10.1 | Jan 2026 | IMDb link fix |
| v10.0 | Jan 2026 | Browse All overhaul, 100-item loads |
| v9.0 | Jan 2026 | Bug fixes, caching, deduplication |
| v8.0 | Jan 2026 | Text visibility, Max added |
| v7.0 | Jan 2026 | Better recommendations |
| v6.0 | Jan 2026 | Detail view modal |
| v5.0 | Jan 2026 | Browse All tab |
| v4.0 | Jan 2026 | Content type filter |
| v3.0 | Jan 2026 | Genre filtering |
| v2.0 | Jan 2026 | What's New tab |
| v1.0 | Jan 2026 | Initial release |

---

**Made with ❤️ for the streaming community**
