# Changelog

All notable changes to Stream Finder will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
