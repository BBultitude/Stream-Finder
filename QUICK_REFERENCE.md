# Stream Finder - Quick Reference Card

**Version:** 9.0 | **Last Updated:** January 2026

## What's New in v9

- ✅ Fixed duplicate content bug
- ✅ Fixed incorrect streaming provider data
- ✅ Added in-memory caching (1-hour expiration)
- ✅ Added IMDb and Rotten Tomatoes links
- ✅ Improved deduplication system
- ✅ Better recommendation algorithm

## Essential Commands

### Container Management
```bash
# Start container
docker start stream-finder

# Stop container
docker stop stream-finder

# Restart container
docker restart stream-finder

# View logs
docker logs -f stream-finder

# Check if running
docker ps | grep stream-finder

# Access container shell
docker exec -it stream-finder sh
```

### Update Application
```bash
cd /srv/sda1/Appdata/stream-finder
nano app.js                    # Make changes
docker build -t stream-finder:latest .
docker restart stream-finder
```

### Complete Rebuild
```bash
cd /srv/sda1/Appdata/stream-finder
docker stop stream-finder
docker rm stream-finder
docker build -t stream-finder:latest .
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

## File Locations

```
/srv/sda1/Appdata/stream-finder/  # Main directory
├── index.html                     # HTML entry point
├── app.js                         # React application
├── Dockerfile                     # Docker build config
├── nginx.conf                     # Web server config
└── README.md                      # Documentation
```

## Port Configuration

Default: `http://localhost:8080`

Change port:
```bash
docker run -d --name stream-finder --restart always -p 9090:80 stream-finder:latest
#                                                      ^^^^
#                                                   New port
```

## Cloudflare Tunnel Commands

```bash
# Start tunnel
cloudflared tunnel run stream-finder

# Check tunnel status
sudo systemctl status cloudflared

# View tunnel logs
sudo journalctl -u cloudflared -f

# Restart tunnel service
sudo systemctl restart cloudflared
```

## Troubleshooting

### Blank Page
1. Check browser console (F12)
2. View container logs: `docker logs stream-finder`
3. Verify files: `docker exec stream-finder ls -la /usr/share/nginx/html/`

### API Errors
Test API manually:
```bash
curl "https://api.themoviedb.org/3/trending/all/week?api_key=8265bd1679663a7ea12ac168da84d2e8"
```

### Container Won't Start
```bash
docker logs stream-finder        # Check error messages
docker ps -a                     # See all containers
docker rm stream-finder          # Remove and rebuild
```

### Port Already in Use
```bash
# Find what's using port 8080
sudo lsof -i :8080

# Kill the process or use different port
docker run -d --name stream-finder --restart always -p 8081:80 stream-finder:latest
```

## API Key Locations in app.js

Replace `8265bd1679663a7ea12ac168da84d2e8` in these 4 places:

1. Line ~53: `fetchWithStreaming` function
2. Line ~73: `loadTrendingContent` function  
3. Line ~92-93: `loadNewReleases` function (2 instances)
4. Line ~126: `searchContent` function

## Backup and Restore

### Backup
```bash
tar -czf ~/stream-finder-backup-$(date +%Y%m%d).tar.gz /srv/sda1/Appdata/stream-finder/
```

### Restore
```bash
tar -xzf ~/stream-finder-backup-YYYYMMDD.tar.gz -C /srv/sda1/Appdata/
cd /srv/sda1/Appdata/stream-finder
docker build -t stream-finder:latest .
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

## Performance Monitoring

```bash
# Container resource usage
docker stats stream-finder

# Disk usage
docker system df

# Network connections
docker port stream-finder
```

## URLs

- Local: `http://localhost:8080`
- Network: `http://YOUR_PI_IP:8080`
- Public (with Cloudflare): `https://streamfinder.yourdomain.com`
- TMDB API: https://www.themoviedb.org/settings/api

## Get Help

- Check logs: `docker logs stream-finder`
- View nginx config: `docker exec stream-finder cat /etc/nginx/conf.d/default.conf`
- Test connectivity: `curl http://localhost:8080`
- Browser console: Press F12 in browser

---

**Keep this file handy for quick access to common commands!**
