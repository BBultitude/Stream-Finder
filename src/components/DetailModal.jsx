import PropTypes from 'prop-types'
import { ArrowLeft, Film, Tv, PlayIcon, Bookmark, Person } from './icons'
import ContentCard from './ContentCard'
import { SkeletonCompactCard } from './SkeletonCard'
import { itemShape } from '../propTypes'
import { formatRuntime } from '../utils/formatRuntime'

export default function DetailModal({ item, similarContent, loadingDetail, onClose, onSimilarClick, isInWatchlist, onWatchlistToggle }) {
  const isMovie = item.media_type === 'movie'
  const displayName = item.title || item.name
  const releaseYear = (item.release_date || item.first_air_date)
    ? new Date(item.release_date || item.first_air_date).getFullYear()
    : null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={onClose}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <div className="grid md:grid-cols-3 gap-6 p-6">
              {/* Poster */}
              <div className="md:col-span-1">
                {item.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={displayName} className="w-full rounded-lg" />
                  : <div className="w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                      {isMovie ? <Film className="w-24 h-24 text-gray-600" /> : <Tv className="w-24 h-24 text-gray-600" />}
                    </div>
                }
              </div>

              {/* Info */}
              <div className="md:col-span-2">
                <h1 className="text-4xl font-bold mb-4 text-white">{displayName}</h1>

                {/* Metadata badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-600 rounded-full text-sm text-white">
                    {isMovie ? 'Movie' : 'TV Show'}
                  </span>
                  {item.vote_average > 0 && (
                    <span className="px-3 py-1 bg-yellow-600 rounded-full text-sm flex items-center gap-1 text-white">
                      ★ {item.vote_average.toFixed(1)}
                    </span>
                  )}
                  {releaseYear !== null && (
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white">{releaseYear}</span>
                  )}
                  {item.runtime && (
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white">{formatRuntime(item.runtime)}</span>
                  )}
                  {item.number_of_seasons && (
                    <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-white">
                      {item.number_of_seasons} Season{item.number_of_seasons === 1 ? '' : 's'}
                      {item.number_of_episodes ? ` · ${item.number_of_episodes} Eps` : ''}
                    </span>
                  )}
                  {item.certification && (
                    <span className="px-3 py-1 bg-gray-700 border border-gray-500 rounded-full text-sm text-white">
                      {item.certification}
                    </span>
                  )}
                </div>

                {/* Streaming platforms */}
                {item.streaming && item.streaming.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm text-gray-300 mb-2">Available on:</h3>
                    <div className="flex flex-wrap gap-2">
                      {item.streaming.map(service => (
                        <div key={service.name} className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg">
                          {service.logo && <img src={service.logo} alt={service.name} className="w-6 h-6 rounded" />}
                          <span className="text-sm text-white">{service.name}</span>
                          {service.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-600 rounded text-[10px] font-semibold text-white leading-tight">New</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status banners */}
                {(item.display_status === 'in_cinemas' || item.display_status === 'coming_soon') && (
                  <div className={`mb-6 px-4 py-3 rounded-lg border flex items-start gap-2 ${
                    item.display_status === 'in_cinemas'
                      ? 'bg-amber-950/50 border-amber-700/50 text-amber-300'
                      : 'bg-blue-950/50 border-blue-700/50 text-blue-300'
                  }`}>
                    <Film className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">
                      {item.display_status === 'in_cinemas'
                        ? 'Currently showing in Australian cinemas — not yet available to stream.'
                        : (() => {
                            const d = item.release_date || item.first_air_date
                            return d
                              ? `Not yet released. Expected ${new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })}.`
                              : 'Not yet released.'
                          })()
                      }
                    </p>
                  </div>
                )}

                {/* Overview */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-white">Overview</h3>
                  <p className="text-gray-300 leading-relaxed">{item.overview || 'No overview available.'}</p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-4">
                  {onWatchlistToggle && (
                    <button
                      onClick={() => onWatchlistToggle(item)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        isInWatchlist
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" filled={isInWatchlist} />
                      {isInWatchlist ? 'Saved to Watchlist' : 'Add to Watchlist'}
                    </button>
                  )}
                  {item.trailer_key && (
                    <a
                      href={`https://www.youtube.com/watch?v=${item.trailer_key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                    >
                      <PlayIcon className="flex-shrink-0" />
                      Watch Trailer
                    </a>
                  )}
                  {item.imdb_id && (
                    <a
                      href={`https://www.imdb.com/title/${item.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium transition-colors"
                    >
                      View on IMDb
                    </a>
                  )}
                  <a
                    href={`https://www.rottentomatoes.com/search?search=${encodeURIComponent(displayName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                  >
                    Search Rotten Tomatoes
                  </a>
                </div>
              </div>
            </div>

            {/* Cast row */}
            {item.cast && item.cast.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="text-2xl font-bold mb-4 text-white">Cast</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {item.cast.map(person => (
                    <div key={person.id} className="flex-shrink-0 w-24 text-center">
                      <div className="w-24 h-32 rounded-lg overflow-hidden bg-gray-800 mb-2 flex items-center justify-center">
                        {person.profile_path
                          ? <img
                              src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          : <Person className="w-10 h-10 text-gray-600" />
                        }
                      </div>
                      <p className="text-xs font-semibold text-white leading-tight line-clamp-2">{person.name}</p>
                      {person.character && (
                        <p className="text-[11px] text-gray-400 leading-tight line-clamp-2 mt-0.5">{person.character}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations skeleton */}
            {loadingDetail && (
              <div className="px-6 pb-6">
                <h3 className="text-2xl font-bold mb-4 text-white">Recommended For You</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCompactCard key={`skel-rec-${i}`} />)}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {!loadingDetail && similarContent.length > 0 && (
              <div className="px-6 pb-6">
                <h3 className="text-2xl font-bold mb-4 text-white">Recommended For You</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {similarContent.map(similar => (
                    <ContentCard key={similar.id} item={similar} onClick={onSimilarClick} variant="compact" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

DetailModal.propTypes = {
  item: itemShape.isRequired,
  similarContent: PropTypes.arrayOf(itemShape),
  loadingDetail: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onSimilarClick: PropTypes.func,
  isInWatchlist: PropTypes.bool,
  onWatchlistToggle: PropTypes.func,
}
