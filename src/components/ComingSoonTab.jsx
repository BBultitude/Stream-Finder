import ComingSoonCard from './ComingSoonCard'
import { Calendar } from './icons'

export default function ComingSoonTab({ items, watchlistKeys, onItemClick, onWatchlistToggle }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-xl font-semibold mb-2 text-white">Nothing coming up yet</p>
        <p className="text-gray-500">Check back after the next data refresh.</p>
      </div>
    )
  }

  const inCinemas  = items.filter(i => i.display_status === 'in_cinemas')
  const comingSoon = items.filter(i => i.display_status === 'coming_soon')

  return (
    <>
      {inCinemas.length > 0 && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6 text-white">🎬 Now Showing in Cinemas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {inCinemas.map(item => (
              <ComingSoonCard
                key={`${item.media_type}:${item.id}`}
                item={item}
                onClick={onItemClick}
                watchlistKeys={watchlistKeys}
                onWatchlistToggle={onWatchlistToggle}
              />
            ))}
          </div>
        </div>
      )}
      {comingSoon.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">🚀 Coming Soon</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {comingSoon.map(item => (
              <ComingSoonCard
                key={`${item.media_type}:${item.id}`}
                item={item}
                onClick={onItemClick}
                watchlistKeys={watchlistKeys}
                onWatchlistToggle={onWatchlistToggle}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
