import ContentCard from './ContentCard'
import { Bookmark } from './icons'

export default function WatchlistTab({ items, watchlistKeys, onItemClick, onWatchlistToggle, onClearAll }) {
  if (items.length === 0) {
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
          My Watchlist <span className="text-gray-400 text-lg font-normal">({items.length})</span>
        </h2>
        <button
          onClick={onClearAll}
          className="px-4 py-2 bg-gray-700 hover:bg-red-800/80 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {items.map(item => (
          <ContentCard
            key={`${item.media_type}:${item.id}`}
            item={item}
            onClick={onItemClick}
            watchlistKeys={watchlistKeys}
            onWatchlistToggle={onWatchlistToggle}
          />
        ))}
      </div>
    </>
  )
}
