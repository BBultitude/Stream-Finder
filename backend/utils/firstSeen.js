'use strict';

const RECENT_RELEASE_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Value stored as streaming_availability.first_seen when a provider row is first created.
 * "New on Platform" means new to the service, so:
 *   - a title we already tracked that now appears on a service is new           -> now
 *   - a title found for the first time that was released in the last 90 days
 *     (e.g. a service original) is new                                          -> now
 *   - an older title found for the first time (catalogue crawl) was almost
 *     certainly there already, so it must never count as new                    -> 0
 */
function firstSeenFor({ isNewTitle, releaseDate, now }) {
  if (!isNewTitle) return now;
  const releaseMs = releaseDate ? new Date(releaseDate).getTime() : Number.NaN;
  if (Number.isNaN(releaseMs)) return 0;
  return now - releaseMs <= RECENT_RELEASE_MS ? now : 0;
}

module.exports = { firstSeenFor };
