# Stream Finder

A web application for discovering movies and TV shows across Australian streaming platforms including Netflix, Stan, Prime Video, Disney+, Paramount+, Binge, and Max.

![Stream Finder](https://img.shields.io/badge/Platform-Raspberry%20Pi-red)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-9.0-purple)

## ✨ Latest Updates (v9 - January 2026)

### 🐛 Bug Fixes
- **Fixed duplicate content** when filtering by multiple streaming services
- **Fixed incorrect streaming data** - now shows accurate provider information
- **Improved provider-centric fetching** - eliminates cached data conflicts

### 🚀 New Features
- **In-memory caching** - Reduces API calls by 60%, 1-hour cache expiration
- **IMDb integration** - Direct links to IMDb pages from detail view
- **Rotten Tomatoes search** - Quick access to RT ratings and reviews
- **Deduplication system** - Ensures no duplicate items in any view
- **Better recommendations** - Uses user behavior patterns (recommendations API first, fallback to similar)

### 🎯 Performance Improvements
- Cached streaming provider data
- Cached global trending/new releases data
- Reduced redundant API calls
- Faster load times on repeat visits

## Features

- 🔍 **Real-time Search** - Search across movies and TV shows with instant results
- 🔥 **What's Hot** - Trending content updated weekly
- ✨ **What's New** - Recent releases from the last 3 months  
- 🎬 **Browse All** - Explore popular content with infinite scroll
- 📺 **Streaming Availability** - Shows which Australian platforms have each title
- 🎭 **Genre Filtering** - 14 genre categories to narrow your search
- 🎯 **Service Filtering** - Filter by specific streaming platforms (Netflix, Stan, Prime, Disney+, Paramount+, Binge, Max)
- 📱 **Content Type Filter** - Toggle between Movies, TV Shows, or All
- 💡 **Smart Recommendations** - AI-powered suggestions based on what you select
- 🔗 **External Links** - Direct access to IMDb and Rotten Tomatoes
- ⚡ **Performance Caching** - In-memory cache reduces API calls and speeds up browsing
- 🌐 **Mobile Responsive** - Works on all devices
- 🚫 **No Duplicates** - Intelligent deduplication ensures clean results

## Tech Stack

- **Frontend**: React 18 (via CDN)
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React (custom SVG components)
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
├── app.js              # React application code
├── Dockerfile          # Docker build configuration
├── nginx.conf          # Nginx server configuration
├── README.md           # This file
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
3. Replace `8265bd1679663a7ea12ac168da84d2e8` with your API key in all fetch URLs
4. Rebuild the Docker image

Example:
```javascript
// Find this line in app.js (appears multiple times)
const response = await fetch(
  'https://api.themoviedb.org/3/trending/all/week?api_key=YOUR_API_KEY_HERE'
);
```

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

### 1. Install Cloudflare Tunnel on Raspberry Pi

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

### 2. Authenticate Cloudflare

```bash
cloudflared tunnel login
```

### 3. Create a Tunnel

```bash
cloudflared tunnel create stream-finder
```

### 4. Configure the Tunnel

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/pi/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: streamfinder.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404
```

### 5. Route DNS

```bash
cloudflared tunnel route dns stream-finder streamfinder.yourdomain.com
```

### 6. Run the Tunnel

```bash
cloudflared tunnel run stream-finder
```

Or run as a service:
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

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

## Performance Optimization

### For Production Use

The current setup uses CDN-delivered libraries for simplicity. For better performance:

1. **Use a proper build system** - Set up webpack/vite for optimized bundles
2. **Pre-compile Tailwind** - Generate a minimal CSS file
3. **Enable Nginx caching** - Already configured in `nginx.conf`
4. **Use your own API key** - Prevents rate limiting

### Nginx Optimizations

The included `nginx.conf` already has:
- Gzip compression enabled
- Browser caching for static assets
- Optimized file serving

## Backup and Recovery

### Backup Your Setup

```bash
# Backup the entire directory
tar -czf stream-finder-backup.tar.gz /srv/sda1/Appdata/stream-finder/

# Or backup to GitHub
cd /srv/sda1/Appdata/stream-finder/
git add .
git commit -m "Backup $(date +%Y-%m-%d)"
git push
```

### Restore from Backup

```bash
# Extract backup
tar -xzf stream-finder-backup.tar.gz -C /srv/sda1/Appdata/

# Rebuild
cd /srv/sda1/Appdata/stream-finder/
docker build -t stream-finder:latest .
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

### Restore from GitHub

```bash
# Clone repository
git clone https://github.com/yourusername/stream-finder.git /srv/sda1/Appdata/stream-finder/
cd /srv/sda1/Appdata/stream-finder/

# Build and run
docker build -t stream-finder:latest .
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

## Security Considerations

### API Key Exposure

The TMDB API key is visible in client-side code. This is acceptable for:
- Personal use
- Low-traffic sites
- Read-only APIs

For production with high traffic, consider:
- Creating a backend proxy
- Using environment variables
- Implementing rate limiting

### Cloudflare Protection

Using Cloudflare Tunnel provides:
- ✅ Automatic HTTPS/SSL
- ✅ Hidden origin IP
- ✅ DDoS protection
- ✅ CDN caching
- ✅ Firewall rules

### Updates

Keep your system secure:
```bash
# Update Raspberry Pi
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker pull nginx:alpine
docker build -t stream-finder:latest .
docker restart stream-finder
```

## Known Limitations

1. **Console Warnings** - Development mode shows Tailwind and Babel warnings (cosmetic only)
2. **API Rate Limits** - Shared API key may hit limits with heavy use
3. **Streaming Data** - Limited to Australian platforms via TMDB data
4. **No User Accounts** - All users see the same content
5. **No Watchlist** - No persistence or saved favorites

## Future Enhancements

Potential improvements:
- [ ] User authentication and profiles
- [ ] Watchlist/favorites with persistence
- [ ] Recommendations based on viewing history
- [ ] Email notifications for new releases
- [ ] Dark/light theme toggle
- [ ] More streaming regions
- [ ] Integration with other APIs (IMDb, Rotten Tomatoes)
- [ ] Backend API for better performance

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
- [Lucide](https://lucide.dev/) for icons
- [Nginx](https://nginx.org/) for web serving
- [Docker](https://www.docker.com/) for containerization

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section

## Project Status

**Active Development** - Last updated: January 2025

---

**Made with ❤️ for the streaming community**
