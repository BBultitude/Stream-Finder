import { Film, Tv, Bookmark } from './icons'
import { GENRES } from './FilterBar'

const GENRE_MAP = Object.fromEntries(GENRES.map(g => [g.id, g.name]))

function formatRuntime(minutes) {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

/**
 * Content card for the main grid.
 * variant="compact" is used for recommendation rows in the detail modal.
 */
export default function ContentCard({ item, onClick, variant = 'default', watchlistKeys, onWatchlistToggle }) {
  const displayName = item.title || item.name
  const isMovie = item.media_type === 'movie'
  const isSaved = watchlistKeys ? watchlistKeys.has(`${item.media_type}:${item.id}`) : false

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onClick(item)}
        className="bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 cursor-pointer"
      >
        {item.poster_path
          ? <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`} alt={displayName} className="w-full aspect-[2/3] object-cover" />
          : <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
              {isMovie ? <Film className="w-12 h-12 text-gray-600" /> : <Tv className="w-12 h-12 text-gray-600" />}
            </div>
        }
        <div className="p-4">
          <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white">{displayName}</h3>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-1 bg-gray-700 rounded text-white">
              {isMovie ? 'Movie' : 'TV Show'}
            </span>
            {item.vote_average > 0 && (
              <span className="text-xs text-yellow-400">★ {item.vote_average.toFixed(1)}</span>
            )}
          </div>
          {item.streaming && item.streaming.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-2">Available on:</p>
              <div className="flex flex-wrap gap-1">
                {item.streaming.slice(0, 3).map((s, i) =>
                  s.logo && <img key={i} src={s.logo} alt={s.name} title={s.name} className="w-8 h-8 rounded object-cover" />
                )}
                {item.streaming.length > 3 && (
                  <span className="text-xs text-gray-400 self-center">+{item.streaming.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

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
        {(() => {
          const newPlatform = item.streaming && item.streaming.find(s => s.isNew)
          return newPlatform && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-600 rounded text-[10px] font-semibold text-white leading-tight">
              New on {newPlatform.name}
            </div>
          )
        })()}
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
          {item.runtime && (
            <span className="text-xs text-gray-400">{formatRuntime(item.runtime)}</span>
          )}
          {item.number_of_seasons && (
            <span className="text-xs text-gray-400">
              {item.number_of_seasons} Season{item.number_of_seasons !== 1 ? 's' : ''}
            </span>
          )}
          {item.certification && (
            <span className="text-xs px-1.5 py-0.5 border border-gray-500 rounded text-gray-300">
              {item.certification}
            </span>
          )}
          {item.display_status === 'in_cinemas' && (
            <span className="text-xs px-2 py-1 bg-amber-700 rounded text-amber-100 flex items-center gap-1">
              <Film className="w-3 h-3" />
              In Cinemas
            </span>
          )}
        </div>
        {(() => {
          const pills = (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 2)
          return pills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {pills.map(name => (
                <span key={name} className="text-xs text-gray-400 bg-gray-700/60 rounded px-1.5 py-0.5">{name}</span>
              ))}
            </div>
          )
        })()}
        {item.streaming && item.streaming.length > 0
          ? <div>
              <p className="text-xs text-gray-400 mb-2">Available on:</p>
              <div className="flex flex-wrap gap-1">
                {item.streaming.slice(0, 3).map((s, i) =>
                  s.logo && <img key={i} src={s.logo} alt={s.name} title={s.name} className="w-8 h-8 rounded object-cover" />
                )}
                {item.streaming.length > 3 && (
                  <span className="text-xs text-gray-400 self-center">+{item.streaming.length - 3}</span>
                )}
              </div>
            </div>
          : item.display_status !== 'in_cinemas' && (
              <p className="text-xs text-gray-500 italic">No streaming info</p>
            )
        }
      </div>
    </div>
  )
}
