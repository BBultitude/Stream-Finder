import PropTypes from 'prop-types'
import { Film, Tv, Bookmark } from './icons'
import { itemShape } from '../propTypes'

function formatReleaseDate(item) {
  const dateStr = item.release_date || item.first_air_date
  if (!dateStr) return 'Date TBC'
  const d = new Date(dateStr)
  const formatted = d.toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })
  if (item.display_status === 'in_cinemas') return formatted
  return d > new Date() ? `Coming ${formatted}` : formatted
}

export default function ComingSoonCard({ item, onClick, watchlistKeys, onWatchlistToggle }) {
  const displayName = item.title || item.name
  const isMovie = item.media_type === 'movie'
  const isInCinemas = item.display_status === 'in_cinemas'
  const isSaved = watchlistKeys ? watchlistKeys.has(`${item.media_type}:${item.id}`) : false

  return (
    <div
      onClick={() => onClick(item)}
      className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 cursor-pointer"
    >
      <div className="relative">
        {item.poster_path
          ? <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={displayName} className="w-full aspect-[2/3] object-cover" />
          : <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
              {isMovie ? <Film className="w-12 h-12 text-gray-600" /> : <Tv className="w-12 h-12 text-gray-600" />}
            </div>
        }
        {/* Status badge */}
        <div className={`absolute top-2 left-2 px-2 py-1 rounded text-[11px] font-semibold leading-none ${
          isInCinemas ? 'bg-amber-600 text-white' : 'bg-blue-700 text-white'
        }`}>
          {isInCinemas ? 'In Cinemas' : 'Coming Soon'}
        </div>
        {/* Watchlist button */}
        {onWatchlistToggle && (
          <button
            onClick={(e) => { e.stopPropagation(); onWatchlistToggle(item) }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg ${
              isSaved
                ? 'bg-purple-600 text-white'
                : 'bg-black/60 text-gray-300 hover:text-white hover:bg-black/80'
            }`}
            title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Bookmark className="w-4 h-4" filled={isSaved} />
          </button>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">{displayName}</h3>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-1 bg-gray-700 rounded text-white">
            {isMovie ? 'Movie' : 'TV Show'}
          </span>
          {item.vote_average > 0 && (
            <span className="text-xs text-yellow-400">★ {item.vote_average.toFixed(1)}</span>
          )}
          {item.certification && (
            <span className="text-xs px-1.5 py-0.5 border border-gray-500 rounded text-gray-300">
              {item.certification}
            </span>
          )}
        </div>
        <p className={`text-xs font-medium ${isInCinemas ? 'text-amber-400' : 'text-blue-400'}`}>
          {formatReleaseDate(item)}
        </p>
      </div>
    </div>
  )
}

ComingSoonCard.propTypes = {
  item: itemShape.isRequired,
  onClick: PropTypes.func.isRequired,
  watchlistKeys: PropTypes.instanceOf(Set),
  onWatchlistToggle: PropTypes.func,
}
