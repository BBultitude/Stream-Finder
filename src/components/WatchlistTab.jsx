import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import ContentCard from './ContentCard'
import { Bookmark } from './icons'
import { fetchDetail } from '../services/apiService'
import { updateWatchlistItem } from '../services/watchlistService'
import { itemShape } from '../propTypes'

function applyFreshItem(prev, targetItem, updatedItem) {
  return prev.map(i => (i.media_type === targetItem.media_type && i.id === targetItem.id) ? updatedItem : i)
}

export default function WatchlistTab({ items, watchlistKeys, onItemClick, onWatchlistToggle, onClearAll }) {
  // Initialise display from stored items; refreshed in background on mount
  const [displayItems, setDisplayItems] = useState(items)

  // On tab open (mount), refresh streaming + display_status for each saved item.
  // Stored data shows immediately (optimistic); badges update as fresh responses arrive.
  useEffect(() => {
    if (items.length === 0) return
    setDisplayItems(items)

    items.forEach(async (item) => {
      try {
        const fresh = await fetchDetail(item.media_type, item.id)
        if (!fresh || (fresh.streaming === undefined && fresh.display_status === undefined)) return

        const updated = {
          ...item,
          streaming: fresh.streaming ?? item.streaming,
          display_status: fresh.display_status ?? item.display_status
        }

        setDisplayItems(prev => applyFreshItem(prev, item, updated))
        await updateWatchlistItem(updated)
      } catch {
        // Silent — stale stored data is better than an error state
      }
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (displayItems.length === 0) {
    return (
      <div className="text-center py-20">
        <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2 text-white">Your watchlist is empty</p>
        <p className="text-gray-500">Browse content and tap the bookmark icon to save titles for later.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          My Watchlist <span className="text-gray-400 text-lg font-normal">({displayItems.length})</span>
        </h2>
        <button
          onClick={onClearAll}
          className="px-4 py-2 bg-gray-700 hover:bg-red-800/80 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {displayItems.map(item => (
          <div key={`${item.media_type}:${item.id}`}>
            <ContentCard
              item={item}
              onClick={onItemClick}
              watchlistKeys={watchlistKeys}
              onWatchlistToggle={onWatchlistToggle}
            />
            {item.display_status === 'unavailable' && (
              <p className="mt-1 text-xs text-center text-amber-500 font-medium">No longer streaming</p>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

WatchlistTab.propTypes = {
  items: PropTypes.arrayOf(itemShape).isRequired,
  watchlistKeys: PropTypes.instanceOf(Set),
  onItemClick: PropTypes.func.isRequired,
  onWatchlistToggle: PropTypes.func.isRequired,
  onClearAll: PropTypes.func.isRequired,
}
