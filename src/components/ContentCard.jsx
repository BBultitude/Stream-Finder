import PropTypes from 'prop-types'
import { Film, Tv, Bookmark } from './icons'
import { GENRES } from './FilterBar'
import { itemShape } from '../propTypes'
import { formatRuntime } from '../utils/formatRuntime'

const GENRE_MAP = Object.fromEntries(GENRES.map(g => [g.id, g.name]))

function NewPlatformBadge({ streaming }) {
  const newPlatform = streaming?.find(s => s.isNew)
  if (!newPlatform) return null
  return (
    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-600 rounded text-[10px] font-semibold text-white leading-tight">
      New on {newPlatform.name}
    </div>
  )
}
NewPlatformBadge.propTypes = { streaming: PropTypes.array }

function GenrePills({ genreIds }) {
  const pills = (genreIds || []).map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 2)
  if (pills.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mb-2">
      {pills.map(name => (
        <span key={name} className="text-xs text-gray-400 bg-gray-700/60 rounded px-1.5 py-0.5">{name}</span>
      ))}
    </div>
  )
}
GenrePills.propTypes = { genreIds: PropTypes.array }

function CompactCard({ item, onClick, priority }) {
  const displayName = item.title || item.name
  const isMovie = item.media_type === 'movie'
  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className="w-full text-left bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 cursor-pointer"
    >
      {item.poster_path
        ? <img
            src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
            srcSet={`https://image.tmdb.org/t/p/w342${item.poster_path} 342w, https://image.tmdb.org/t/p/w500${item.poster_path} 500w, https://image.tmdb.org/t/p/w780${item.poster_path} 780w`}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
            alt={displayName}
            className="w-full aspect-[2/3] object-cover"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
          />
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
              {item.streaming.slice(0, 3).map(s =>
                s.logo && <img key={s.name} src={s.logo} alt={s.name} title={s.name} className="w-8 h-8 rounded object-cover" loading="lazy" />
              )}
              {item.streaming.length > 3 && (
                <span className="text-xs text-gray-400 self-center">+{item.streaming.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </button>
  )
}
CompactCard.propTypes = {
  item: itemShape.isRequired,
  onClick: PropTypes.func.isRequired,
  priority: PropTypes.bool,
}

function DefaultCard({ item, onClick, isSaved, onWatchlistToggle, priority }) {
  const displayName = item.title || item.name
  const isMovie = item.media_type === 'movie'
  return (
    // Outer wrapper provides visual styling and hover effects.
    // The inner <button> is the card action; the watchlist <button> is a sibling
    // (not nested) to avoid invalid HTML of <button> inside <button>.
    <div className="relative bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 focus-within:border-purple-500 cursor-pointer">
      <button type="button" onClick={() => onClick(item)} className="w-full text-left block focus:outline-none">
        <div className="relative">
          {item.poster_path
            ? <img
                src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                srcSet={`https://image.tmdb.org/t/p/w342${item.poster_path} 342w, https://image.tmdb.org/t/p/w500${item.poster_path} 500w, https://image.tmdb.org/t/p/w780${item.poster_path} 780w`}
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                alt={displayName}
                className="w-full aspect-[2/3] object-cover"
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
              />
            : <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center">
                {isMovie ? <Film className="w-12 h-12 text-gray-600" /> : <Tv className="w-12 h-12 text-gray-600" />}
              </div>
          }
          <NewPlatformBadge streaming={item.streaming} />
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
                {item.number_of_seasons} Season{item.number_of_seasons === 1 ? '' : 's'}
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
          <GenrePills genreIds={item.genre_ids} />
          {item.streaming && item.streaming.length > 0
            ? <div>
                <p className="text-xs text-gray-400 mb-2">Available on:</p>
                <div className="flex flex-wrap gap-1">
                  {item.streaming.slice(0, 3).map(s =>
                    s.logo && <img key={s.name} src={s.logo} alt={s.name} title={s.name} className="w-8 h-8 rounded object-cover" />
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
      </button>
      {onWatchlistToggle && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onWatchlistToggle(item) }}
          className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-lg ${
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
  )
}
DefaultCard.propTypes = {
  item: itemShape.isRequired,
  onClick: PropTypes.func.isRequired,
  isSaved: PropTypes.bool,
  onWatchlistToggle: PropTypes.func,
  priority: PropTypes.bool,
}

export default function ContentCard({ item, onClick, variant = 'default', watchlistKeys, onWatchlistToggle, priority = false }) {
  const isSaved = watchlistKeys ? watchlistKeys.has(`${item.media_type}:${item.id}`) : false
  if (variant === 'compact') return <CompactCard item={item} onClick={onClick} priority={priority} />
  return <DefaultCard item={item} onClick={onClick} isSaved={isSaved} onWatchlistToggle={onWatchlistToggle} priority={priority} />
}

ContentCard.propTypes = {
  item: itemShape.isRequired,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'compact']),
  watchlistKeys: PropTypes.instanceOf(Set),
  onWatchlistToggle: PropTypes.func,
  priority: PropTypes.bool,
}
