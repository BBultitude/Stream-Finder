'use strict';

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// TMDB status values that indicate content is not yet released
const COMING_SOON_STATUSES = new Set([
  'Rumored', 'Planned', 'In Production', 'Post Production'
]);

/**
 * Compute display_status for a content item.
 *
 * Classification (per IMP-09):
 *   streaming     — has confirmed AU streaming availability
 *   in_cinemas    — movies only: released, no streaming, within 90 days of release
 *   unavailable   — released, no streaming, older than 90 days (or TV within 90 days)
 *   coming_soon   — not yet released, or future release date
 *
 * @param {object} params
 * @param {string|null} params.tmdbStatus   TMDB status field (may be null if detail not yet fetched)
 * @param {string|null} params.releaseDate  ISO date string YYYY-MM-DD (or null)
 * @param {boolean}     params.hasAuStreaming  whether item has confirmed AU flatrate streaming
 * @param {string|null} params.mediaType    'movie' | 'tv' — only movies can be in_cinemas
 * @returns {'streaming'|'in_cinemas'|'unavailable'|'coming_soon'}
 */
function computeDisplayStatus({ tmdbStatus, releaseDate, hasAuStreaming, mediaType }) {
  // Confirmed streaming always overrides all other signals
  if (hasAuStreaming) {
    return 'streaming';
  }

  // If TMDB explicitly marks this as pre-release
  if (tmdbStatus && COMING_SOON_STATUSES.has(tmdbStatus)) {
    return 'coming_soon';
  }

  if (releaseDate) {
    const releaseMs = new Date(releaseDate).getTime();
    const now = Date.now();

    if (Number.isNaN(releaseMs)) {
      return 'coming_soon';
    }

    // Future release date → coming soon
    if (releaseMs > now) {
      return 'coming_soon';
    }

    // Past release, within 90-day theatrical window → in_cinemas for movies only
    // TV shows don't have theatrical releases; classify them as unavailable
    if (now - releaseMs <= NINETY_DAYS_MS) {
      return mediaType === 'movie' ? 'in_cinemas' : 'unavailable';
    }

    // Past release, older than 90 days, no streaming → data gap
    return 'unavailable';
  }

  // No release date and no streaming → assume not yet released
  return 'coming_soon';
}

module.exports = { computeDisplayStatus };
