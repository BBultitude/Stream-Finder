import PropTypes from 'prop-types'
import { Film } from './icons'
import { itemShape } from '../propTypes'

export default function Top10List({ items, onItemClick }) {
  if (items.length === 0) {
    return (
      <p className="text-center py-12 text-gray-400">
        No streaming titles available yet — check back after the first data refresh.
      </p>
    )
  }

  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {items.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onItemClick(item)}
          className="w-full text-left flex items-center gap-4 bg-gray-800 rounded-xl p-3 hover:bg-gray-700 border border-gray-700 hover:border-purple-500 cursor-pointer transition-all"
        >
          <span className="text-4xl font-black w-12 text-center flex-shrink-0 text-gray-600 select-none">
            {idx + 1}
          </span>
          {item.poster_path
            ? <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name} className="w-12 h-16 object-cover rounded flex-shrink-0" />
            : <div className="w-12 h-16 bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                <Film className="w-6 h-6 text-gray-500" />
              </div>
          }
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate">{item.title || item.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-300">
                {item.media_type === 'movie' ? 'Movie' : 'TV Show'}
              </span>
              {item.vote_average > 0 && (
                <span className="text-xs text-yellow-400">★ {item.vote_average.toFixed(1)}</span>
              )}
            </div>
          </div>
          {item.streaming && item.streaming.length > 0 && (
            <div className="flex gap-1 flex-shrink-0">
              {item.streaming.slice(0, 3).map(s =>
                s.logo && <img key={s.name} src={s.logo} alt={s.name} title={s.name} className="w-7 h-7 rounded object-cover" />
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

Top10List.propTypes = {
  items: PropTypes.arrayOf(itemShape).isRequired,
  onItemClick: PropTypes.func.isRequired,
}
