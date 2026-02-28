# ─── Stage 1: Build frontend ──────────────────────────────────────────────────
# Vite + React + Tailwind — build tools stay in this stage only
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY package.json ./
RUN npm install
COPY index.html vite.config.js tailwind.config.js postcss.config.js ./
COPY src/ ./src/
RUN npm run build

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
# IMP-03: Node.js + Express backend alongside Nginx inside a single container.
# supervisord manages both processes. SQLite data mounted at /data (Docker volume).
FROM node:20-alpine

# Install nginx, supervisor, and build tools required by better-sqlite3
RUN apk add --no-cache nginx supervisor python3 make g++

# ── Backend: install dependencies ────────────────────────────────────────────
WORKDIR /app/backend
COPY backend/package.json .
RUN npm install --production

# Remove build tools after native compilation to keep image lean
RUN apk del python3 make g++

# Copy remaining backend source
COPY backend/ .

# ── Frontend: serve built assets from Vite ────────────────────────────────────
RUN mkdir -p /usr/share/nginx/html
COPY --from=frontend-builder /build/dist/ /usr/share/nginx/html/

# ── Config ────────────────────────────────────────────────────────────────────
COPY nginx.conf      /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ── Data directory ────────────────────────────────────────────────────────────
# In production, mount a Docker volume here: -v /host/path:/data
RUN mkdir -p /data

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
