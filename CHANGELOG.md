# Changelog

All notable changes to Stream Finder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [11.2] - 2026-06-21

### Security
- Dockerfile + supervisord.conf: Node.js backend process now runs as non-root `node` user — `/app/backend` and `/data` ownership transferred via `chown` at build time

### Fixed
- `DetailModal.jsx`: leaked conditional — `{releaseYear && ...}` replaced with `{releaseYear !== null && ...}` to prevent rendering `0` in edge cases
- `App.jsx`, `DetailModal.jsx`: skeleton placeholder React keys now use string prefixes (`skel-top10-*`, `skel-card-*`, `skel-rec-*`) to satisfy stable-key requirement
- `App.jsx`: `window.confirm` → `globalThis.confirm`
- `App.jsx`, `ContentCard.jsx`, `DetailModal.jsx`, `apiService.js`: all negated equality conditions (`!== 'all'`, `!== 'popularity'`, `!== 1`) flipped to positive form
- `icons.jsx`: PropTypes declarations added to all 13 icon components

### Changed
- `src/utils/formatRuntime.js`: extracted shared runtime formatter (was duplicated in ContentCard and DetailModal); nested ternary replaced with if/else branches
- `App.jsx`: `filterContent` and `getRawTabContent` extracted to module scope — eliminates 7-line chained ternary for `displayContent` and reduces cognitive complexity of `App()`; tab section heading uses object lookup instead of nested ternary
- `App.jsx`: `handleDeleteHistory` extracted as named handler — removes 5-level function nesting in search history JSX
- `ContentCard.jsx`: `NewPlatformBadge` and `GenrePills` extracted as named sub-components — removes IIFE blocks and reduces cognitive complexity
- `WatchlistTab.jsx`: `applyFreshItem` extracted as module-level helper — removes 5-level function nesting in the refresh `useEffect`
- `backend/jobs/refresh.js`: `refreshDecade()` extracted from `refreshByDecade()` — reduces `refreshByDecade` cognitive complexity from 26 to ~4
- `ComingSoonCard.jsx`, `ContentCard.jsx`, `FilterSheet.jsx`, `Top10List.jsx`: interactive `<div>` elements now have `role="button"`, `tabIndex={0}`, and `onKeyDown` keyboard handlers

## [11.1] - 2026-06-21

### Added
- `src/propTypes.js`: shared PropTypes shape definitions (`itemShape`, `streamingEntryShape`, `castMemberShape`)
- PropTypes declarations added to all components: ContentCard, DetailModal, FilterBar, FilterSheet, ComingSoonTab, Top10List, WatchlistTab, BottomNav, TabNav, ComingSoonCard

### Fixed
- ContentCard, DetailModal, Top10List: streaming logo maps used array index as React key — replaced with stable service name key
- `backend/routes/detail.js`: `parseInt` → `Number.parseInt`; all silent `.catch(() => ({}))` blocks in `Promise.all` and `fetchRecommendations` now log via `console.warn`
- `backend/utils/displayStatus.js`: `isNaN` → `Number.isNaN`
- `backend/db.js`: swallowed migration catch now logs `err.message` instead of silently ignoring all errors
- `backend/routes/search.js`: `!query || !query.trim()` → `!query?.trim()`
- `src/App.jsx`: negated early-return guard in `handleClearWatchlist` flipped to positive form
- `vite.config.js`: `manualChunks` object literal replaced with function — required by Vite 8 / rolldown (breaking change from Vite 5)

### Technical
- Dockerfile: merged consecutive `RUN npm install --production` + `RUN apk del` into a single layer
- Dockerfile: frontend builder now copies `package-lock.json` and uses `npm ci` — ensures Docker uses the same dependency versions as local
- Dockerfile: `ARG VITE_APP_URL` given a default value — prevents `%VITE_APP_URL%` resolving to `/` in CI builds, which caused Vite 8/rolldown to attempt reading the build directory as a file (EISDIR)

## [11.0] - 2026-06-21

### Added
- Coming Soon tab: Streaming / Cinemas pill segmented control — defaults to Streaming view, toggle to see currently in-cinemas titles separately
- Age rating filter: AU classification ceiling (G / PG / M / MA15+ / R18+) on Browse; filters content at or below selected rating via `maxCertification` backend param
- `backend/utils/certOrder.js`: AU certification order utility (`certsUpTo()` helper)

### Changed
- FilterSheet: compact button sizing (`px-2.5 py-1.5 text-xs`), tighter section labels — fits more content without scrolling on small screens
- FilterSheet: Age Rating section added between Content Type and Streaming Services

### Fixed
- `detail.js`: TMDB `external_ids` call now has individual `.catch` fallback — a failed TMDB call no longer returns a 500 for the whole detail response
- `server.js`: `startCronJobs()` now runs unconditionally — previously skipped if `runInitialRefreshIfNeeded()` rejected
- `search.js`: Conditional braces fix (S2681) on page-1 fetch error check
- `refresh.js`: Each cron job now has a `running` guard — overlapping executions are skipped with a log warning instead of running concurrently
- `refresh.js`: Initial refresh chain now runs each job independently — one failure no longer skips the rest
- `eslint.config.js`: Added `requestAnimationFrame` to globals — was causing CI lint failure

### Security
- `server.js`: `app.disable('x-powered-by')` — suppresses Express version header

### Technical
- `search.js`: Per-IP sliding-window rate limiter (10 req/min) to protect TMDB quota
- Deleted `app.js` legacy CDN monolith — not served since IMP-04, was generating false-positive SonarQube issues

## [10.1] - 2026-01-18

### Fixed
- IMDb links now appear correctly in detail view
- Added external_ids API call to fetch IMDb IDs dynamically
- IMDb button displays for all content with IMDb entries

### Technical
- Modified `handleItemClick` to fetch external IDs in parallel with similar content
- IMDb ID now added to selected item state after fetch

---

## [10.0] - 2026-01-18

### Added
- Browse All now truly browses ALL TMDB content (not just cached)
- Proper pagination support for Browse All with Load More
- Search automatically deselects tabs for visual clarity
- Auto-return to "What's Hot" when clearing search

### Changed
- **BREAKING**: Increased What's Hot from 40 to 100 items (5 pages)
- **BREAKING**: Increased What's New from 40 to 100 items (5 pages)
- Expanded What's New time range from 3 to 6 months
- Browse All now uses discover endpoint instead of cached data
- Load More now works in all filtering scenarios

### Fixed
- Load More button functionality restored
- Browse All now shows different content than What's Hot/New
- Tab selection visual state during search

### Performance
- More meaningful genre filtering with 100-item datasets
- Better content discovery with larger initial loads

---

## [9.0] - 2026-01-17

### Added
- In-memory caching system with 1-hour TTL
- Comprehensive deduplication across all data fetches
- Cache for streaming provider data
- Cache for global trending/new releases data
- Provider-specific content caching

### Fixed
- **CRITICAL**: Duplicate content when filtering by multiple streaming services
- **CRITICAL**: Incorrect streaming provider data display
- Provider-centric fetching now embeds correct provider metadata
- Streaming logos fetched and merged correctly

### Changed
- Recommendations API prioritized over similar API
- Increased recommendations from 8 to 12 items

### Performance
- Reduced API calls by approximately 60%
- Faster repeat visits with persistent cache
- Optimized multi-provider fetching

---

## [8.0] - 2026-01-16

### Added
- Max (HBO Max) streaming service support

### Changed
- Improved text contrast on dark backgrounds
- All button text now uses lighter colors (text-gray-200, text-white)
- Description text improved to text-gray-300

### Removed
- Australian FTA providers (7plus, 9Now, 10 play, SBS On Demand, ABC iview)
- Cluttered UI from non-subscription services

### Fixed
- Text visibility issues on dark theme
- Black text on dark backgrounds

---

## [7.0] - 2026-01-15

### Added
- Rotten Tomatoes search integration
- Better recommendation algorithm using user behavior patterns

### Changed
- Recommendations API used as primary source
- Similar API used as fallback only
- Increased recommendations from 8 to 12 items
- Changed "Similar Titles" to "Recommended For You"

### Technical
- Dual API strategy for recommendations (recommendations → similar fallback)

---

## [6.0] - 2026-01-14

### Added
- Full-screen detail view modal for movies and TV shows
- Click any content card to see complete details
- Back button in detail view
- Synopsis/overview display
- Year display for all content
- Streaming platform logos in detail view
- Similar/recommended titles section in detail view

### Changed
- Cards now clickable for detail view
- Hover effects enhanced for better UX

---

## [5.0] - 2026-01-13

### Added
- "Browse All" tab for exploring popular content
- Load More button for pagination
- Infinite scroll capability

### Changed
- Tab navigation expanded to three options
- Content sorted by popularity in Browse All

---

## [4.0] - 2026-01-12

### Added
- Content Type filtering (All, Movies, TV Shows)
- Filter toggles for content type selection
- Content type filter works across all tabs

### Changed
- Filtering architecture improved for multi-dimensional filters
- Genre + Service + Content Type filtering now works together

---

## [3.0] - 2026-01-11

### Added
- Genre filtering with 14 categories
  - Action, Adventure, Animation, Comedy, Crime
  - Documentary, Drama, Family, Fantasy, Horror
  - Mystery, Romance, Sci-Fi, Thriller
- Multi-select genre filtering
- Genre filter dropdown UI

### Changed
- Filter system expanded to support genre + service combination
- Clear all filters button now resets genres too

---

## [2.0] - 2026-01-10

### Added
- "What's New" tab showing recent releases
- Date-based filtering (3 months initially)
- Release date sorting

### Changed
- Tab navigation introduced (What's Hot, What's New)
- Default view remains What's Hot

---

## [1.0] - 2026-01-09

### Added
- Initial release of Stream Finder
- "What's Hot" tab with trending content
- Real-time search functionality
- Streaming service filtering
  - Netflix, Prime Video, Stan, Paramount+, Disney+, Binge
- Australian streaming availability display
- TMDB API integration
- Docker containerization
- Nginx web server
- Responsive mobile design
- Dark theme UI

### Technical
- React 18 via CDN
- Tailwind CSS via CDN
- Custom SVG icon components
- TMDB API integration
- Docker + nginx deployment

---

## Release Notes Format

### Added
New features.

### Changed
Changes in existing functionality.

### Deprecated
Soon-to-be removed features.

### Removed
Removed features.

### Fixed
Bug fixes.

### Security
Security vulnerability fixes.

### Performance
Performance improvements.

### Technical
Technical/architectural changes.

---

## Upcoming Features (Planned)

- [ ] IndexedDB persistent caching (v11.0)
- [ ] User accounts and authentication (v12.0)
- [ ] Watchlist functionality (v12.0)
- [ ] Viewing history tracking (v12.0)
- [ ] Backend API with database (v13.0)
- [ ] GraphQL API layer (v13.0)
- [ ] Mobile app (React Native) (v14.0)

---

## Migration Guide

### Migrating from v9.0 to v10.1

**Breaking Changes:**
- What's Hot now loads 100 items instead of 40
- What's New now loads 100 items instead of 40
- What's New time range expanded from 3 to 6 months

**Action Required:**
1. Update app.js to v10.1
2. Rebuild Docker container
3. Purge Cloudflare cache
4. Clear browser cache

**Benefits:**
- Much better genre filtering with larger datasets
- True browse all functionality
- IMDb links now work correctly

### Migrating from v8.0 to v9.0

**Breaking Changes:**
- None (backward compatible)

**Action Required:**
1. Update app.js to v9.0
2. Rebuild Docker container
3. Purge Cloudflare cache

**Benefits:**
- No more duplicate content
- Correct streaming provider data
- Faster performance with caching

---

**Maintained by:** Stream Finder Team  
**Repository:** https://github.com/yourusername/stream-finder  
**License:** MIT
