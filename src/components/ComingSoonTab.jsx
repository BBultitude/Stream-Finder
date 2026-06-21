import { useState } from 'react'
import PropTypes from 'prop-types'
import ComingSoonCard from './ComingSoonCard'
import { Calendar } from './icons'
import { itemShape } from '../propTypes'

const VIEWS = [
  { id: 'streaming', label: '🚀 Coming Soon', status: 'coming_soon' },
  { id: 'cinemas',   label: '🎬 In Cinemas',  status: 'in_cinemas'  },
]

export default function ComingSoonTab({ items, watchlistKeys, onItemClick, onWatchlistToggle }) {
  const [view, setView] = useState('streaming')

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2 text-white">Nothing coming up yet</p>
        <p className="text-gray-500">Check back after the next data refresh.</p>
      </div>
    )
  }

  const activeStatus = VIEWS.find(v => v.id === view).status
  const visible = items.filter(i => i.display_status === activeStatus)

  return (
    <div>
      {/* Segmented control */}
      <div className="flex gap-2 mb-6">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              view === v.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500">Nothing here right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {visible.map(item => (
            <ComingSoonCard
              key={`${item.media_type}:${item.id}`}
              item={item}
              onClick={onItemClick}
              watchlistKeys={watchlistKeys}
              onWatchlistToggle={onWatchlistToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

ComingSoonTab.propTypes = {
  items: PropTypes.arrayOf(itemShape).isRequired,
  watchlistKeys: PropTypes.instanceOf(Set),
  onItemClick: PropTypes.func.isRequired,
  onWatchlistToggle: PropTypes.func,
}
