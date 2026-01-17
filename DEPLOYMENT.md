# Stream Finder - Deployment Checklist

Complete step-by-step guide for deploying Stream Finder from scratch on a Raspberry Pi.

## Prerequisites Checklist

- [ ] Raspberry Pi with Raspbian/Raspberry Pi OS installed
- [ ] SSH access to Raspberry Pi
- [ ] Docker installed on Raspberry Pi
- [ ] Internet connection
- [ ] (Optional) Domain name for Cloudflare Tunnel
- [ ] (Optional) Cloudflare account

## Part 1: Initial Setup

### 1.1 Install Docker (if not installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -sSL https://get.docker.com | sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Reboot to apply changes
sudo reboot

# After reboot, verify Docker is working
docker --version
```

### 1.2 Create Project Directory

```bash
# Create directory
sudo mkdir -p /srv/sda1/Appdata/stream-finder
cd /srv/sda1/Appdata/stream-finder

# Set permissions
sudo chown -R $USER:$USER /srv/sda1/Appdata/stream-finder
```

## Part 2: Download Project Files

### Option A: Clone from GitHub

```bash
cd /srv/sda1/Appdata/stream-finder
git clone https://github.com/yourusername/stream-finder.git .
```

### Option B: Manual File Creation

If Git isn't available, create files manually:

```bash
cd /srv/sda1/Appdata/stream-finder

# Create index.html
nano index.html
# Paste content from repository, save with Ctrl+X, Y, Enter

# Create app.js
nano app.js
# Paste content from repository, save with Ctrl+X, Y, Enter

# Create Dockerfile
nano Dockerfile
# Paste content from repository, save with Ctrl+X, Y, Enter

# Create nginx.conf
nano nginx.conf
# Paste content from repository, save with Ctrl+X, Y, Enter
```

## Part 3: Build and Deploy

### 3.1 Verify Files

```bash
cd /srv/sda1/Appdata/stream-finder
ls -la
```

You should see:
- `index.html`
- `app.js`
- `Dockerfile`
- `nginx.conf`
- `README.md` (if from Git)

### 3.2 Build Docker Image

```bash
docker build -t stream-finder:latest .
```

Expected output: `Successfully tagged stream-finder:latest`

### 3.3 Run Container

```bash
docker run -d \
  --name stream-finder \
  --restart always \
  -p 8080:80 \
  stream-finder:latest
```

### 3.4 Verify Container is Running

```bash
docker ps | grep stream-finder
```

You should see output showing the container is running.

### 3.5 Check Logs

```bash
docker logs stream-finder
```

Should show nginx starting successfully.

### 3.6 Test Locally

```bash
# Get your Pi's IP address
hostname -I

# Open browser and visit:
# http://YOUR_PI_IP:8080
```

- [ ] Site loads successfully
- [ ] Search bar appears
- [ ] "What's Hot" and "What's New" tabs are visible
- [ ] Trending content loads automatically

## Part 4: Get Your Own TMDB API Key (Recommended)

### 4.1 Create TMDB Account

1. Visit https://www.themoviedb.org/
2. Click "Join TMDB"
3. Fill out registration form
4. Verify email

### 4.2 Request API Key

1. Log in to TMDB
2. Go to Settings → API
3. Click "Create" or "Request an API Key"
4. Choose "Developer"
5. Accept terms
6. Fill out the form:
   - **Application Name**: Stream Finder
   - **Application URL**: Your domain or localhost
   - **Application Summary**: Personal streaming discovery tool

### 4.3 Update app.js

```bash
cd /srv/sda1/Appdata/stream-finder
nano app.js
```

Find and replace ALL instances of:
```
8265bd1679663a7ea12ac168da84d2e8
```

With your new API key.

There are 4 locations to replace:
1. `fetchWithStreaming` function
2. `loadTrendingContent` function
3. `loadNewReleases` function (2 instances)
4. `searchContent` function

Save with `Ctrl+X`, `Y`, `Enter`

### 4.4 Rebuild After API Key Change

```bash
docker build -t stream-finder:latest .
docker stop stream-finder
docker rm stream-finder
docker run -d --name stream-finder --restart always -p 8080:80 stream-finder:latest
```

## Part 5: Public Access with Cloudflare Tunnel (Optional)

### 5.1 Install Cloudflared

```bash
# For Raspberry Pi (ARM64)
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64

# Move to system path
sudo mv cloudflared-linux-arm64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# Verify installation
cloudflared --version
```

### 5.2 Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Log in to Cloudflare and select your domain.

### 5.3 Create Tunnel

```bash
cloudflared tunnel create stream-finder
```

Note the **Tunnel ID** shown in the output.

### 5.4 Create Config File

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Paste this configuration (replace YOUR_TUNNEL_ID and YOUR_DOMAIN):

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/pi/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: streamfinder.YOUR_DOMAIN.com
    service: http://localhost:8080
  - service: http_status:404
```

Save with `Ctrl+X`, `Y`, `Enter`

### 5.5 Configure DNS

```bash
cloudflared tunnel route dns stream-finder streamfinder.YOUR_DOMAIN.com
```

### 5.6 Test Tunnel

```bash
cloudflared tunnel run stream-finder
```

Visit `https://streamfinder.YOUR_DOMAIN.com` in your browser.

- [ ] Site loads via HTTPS
- [ ] No certificate warnings
- [ ] All features work

If working, press `Ctrl+C` to stop.

### 5.7 Install as System Service

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 5.8 Verify Service

```bash
sudo systemctl status cloudflared
```

Should show "active (running)".

## Part 6: Monitoring and Maintenance

### 6.1 Set Up Auto-Updates (Optional)

Create update script:

```bash
nano ~/update-stream-finder.sh
```

Paste:
```bash
#!/bin/bash
cd /srv/sda1/Appdata/stream-finder
git pull
docker build -t stream-finder:latest .
docker restart stream-finder
echo "Stream Finder updated at $(date)" >> ~/stream-finder-updates.log
```

Make executable:
```bash
chmod +x ~/update-stream-finder.sh
```

### 6.2 Create Monitoring Script

```bash
nano ~/check-stream-finder.sh
```

Paste:
```bash
#!/bin/bash
if ! docker ps | grep -q stream-finder; then
    echo "Stream Finder is down! Restarting..." | mail -s "Stream Finder Alert" your@email.com
    docker start stream-finder
fi
```

Make executable:
```bash
chmod +x ~/check-stream-finder.sh
```

Add to crontab:
```bash
crontab -e
```

Add line:
```
*/5 * * * * /home/pi/check-stream-finder.sh
```

### 6.3 Backup Configuration

```bash
# Create backup script
nano ~/backup-stream-finder.sh
```

Paste:
```bash
#!/bin/bash
BACKUP_DIR=~/backups/stream-finder
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/stream-finder-$DATE.tar.gz /srv/sda1/Appdata/stream-finder
# Keep only last 7 backups
ls -t $BACKUP_DIR/*.tar.gz | tail -n +8 | xargs rm -f
```

Make executable:
```bash
chmod +x ~/backup-stream-finder.sh
```

Run weekly via crontab:
```bash
crontab -e
```

Add:
```
0 2 * * 0 /home/pi/backup-stream-finder.sh
```

## Part 7: Testing Checklist

### Functionality Tests

- [ ] Search works (try "Avengers")
- [ ] "What's Hot" shows trending content
- [ ] "What's New" shows recent releases
- [ ] Streaming service filter works
- [ ] Genre filter works
- [ ] Multiple filters work together
- [ ] Clear filters button works
- [ ] Poster images load
- [ ] Streaming platform logos appear
- [ ] Mobile responsive (test on phone)

### Performance Tests

- [ ] Page loads in under 3 seconds
- [ ] Search results appear quickly
- [ ] No console errors (F12 developer tools)
- [ ] Images load progressively
- [ ] Filters respond instantly

### Security Tests

- [ ] HTTPS works (if using Cloudflare)
- [ ] No mixed content warnings
- [ ] Site accessible only via intended domain/IP
- [ ] Docker container runs as non-root (nginx user)

## Part 8: Common Issues and Solutions

### Issue: Container won't start

**Solution:**
```bash
docker logs stream-finder
# Check for errors

# Verify files exist
docker exec stream-finder ls -la /usr/share/nginx/html/

# If files missing, rebuild
docker build -t stream-finder:latest .
```

### Issue: Blank page

**Solutions:**
1. Check browser console (F12) for errors
2. Verify React loads: View page source, check for React CDN
3. Test API: `curl "https://api.themoviedb.org/3/trending/all/week?api_key=YOUR_KEY"`
4. Check nginx logs: `docker logs stream-finder`

### Issue: Port already in use

**Solution:**
```bash
# Use different port
docker run -d --name stream-finder --restart always -p 9090:80 stream-finder:latest
```

### Issue: API rate limiting

**Solution:**
- Get your own TMDB API key (see Part 4)
- Implement caching in nginx (already configured)

### Issue: Cloudflare tunnel not working

**Solutions:**
1. Check tunnel status: `sudo systemctl status cloudflared`
2. View logs: `sudo journalctl -u cloudflared -f`
3. Verify DNS propagation: `nslookup streamfinder.yourdomain.com`
4. Test local access first: `http://localhost:8080`

## Part 9: Post-Deployment

### Set Up Monitoring

1. Enable Docker stats: `docker stats stream-finder`
2. Set up uptime monitoring (UptimeRobot, Pingdom)
3. Configure Cloudflare analytics

### Share Your Site

Once everything is working:
- [ ] Share with friends/family
- [ ] Add to your portfolio
- [ ] Submit to streaming discovery communities
- [ ] Document any custom modifications

### Plan for Growth

Consider:
- Adding user accounts
- Implementing watchlists
- Setting up a database
- Creating a mobile app
- Adding more streaming services

---

## Quick Reference Commands

```bash
# View logs
docker logs -f stream-finder

# Restart
docker restart stream-finder

# Stop
docker stop stream-finder

# Start
docker start stream-finder

# Rebuild after changes
cd /srv/sda1/Appdata/stream-finder
docker build -t stream-finder:latest .
docker restart stream-finder

# Check status
docker ps | grep stream-finder

# Access shell
docker exec -it stream-finder sh

# Remove everything (clean slate)
docker stop stream-finder
docker rm stream-finder
docker rmi stream-finder:latest
```

---

## Support Resources

- TMDB API Docs: https://developers.themoviedb.org/3
- Docker Docs: https://docs.docker.com/
- Nginx Docs: https://nginx.org/en/docs/
- Cloudflare Tunnel Docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- React Docs: https://react.dev/

---

**Deployment Complete! 🎉**

Your Stream Finder is now live and ready to help you discover great content!
