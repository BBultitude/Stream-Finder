import PropTypes from 'prop-types'
import { TrendingUp, Sparkles, Grid, Search, Bookmark, Calendar } from './icons'

const TABS = [
  { id: 'trending',    label: 'Home',    Icon: TrendingUp },
  { id: 'new',         label: 'New',     Icon: Sparkles },
  { id: 'browse',      label: 'Browse',  Icon: Grid },
  { id: 'coming-soon', label: 'Soon',    Icon: Calendar },
  { id: 'watchlist',   label: 'Saved',   Icon: Bookmark },
  { id: 'search',      label: 'Search',  Icon: Search },
]

/**
 * Fixed bottom navigation bar shown on mobile (< 768px).
 * Replaces top TabNav on small screens.
 */
export default function BottomNav({ activeTab, onTabChange, onSearchFocus, watchlistCount }) {
  const handleTap = (tabId) => {
    if (tabId === 'search') {
      onSearchFocus()
    } else {
      onTabChange(tabId)
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-700 flex">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            onClick={() => handleTap(id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors ${
              isActive ? 'text-purple-400' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" filled={id === 'watchlist' && isActive} />
              {id === 'watchlist' && watchlistCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-purple-600 rounded-full text-[10px] flex items-center justify-center text-white px-0.5">
                  {watchlistCount > 99 ? '99+' : watchlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

BottomNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onSearchFocus: PropTypes.func.isRequired,
  watchlistCount: PropTypes.number,
}
