import PropTypes from 'prop-types'
import { TrendingUp, Sparkles, Grid, Bookmark, Calendar } from './icons'

export default function TabNav({ activeTab, onTabChange, watchlistCount }) {
  return (
    <nav aria-label="Sections" className="max-w-5xl mx-auto mb-8 flex gap-3 flex-wrap">
      <button
        onClick={() => onTabChange('trending')}
        aria-current={activeTab === 'trending' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'trending'
            ? 'bg-gradient-to-r from-orange-700 to-red-700 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        What&apos;s Hot
      </button>

      <button
        onClick={() => onTabChange('new')}
        aria-current={activeTab === 'new' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'new'
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        What&apos;s New
      </button>

      <button
        onClick={() => onTabChange('browse')}
        aria-current={activeTab === 'browse' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'browse'
            ? 'bg-gradient-to-r from-green-700 to-teal-700 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Grid className="w-5 h-5" />
        Browse All
      </button>

      <button
        onClick={() => onTabChange('top10')}
        aria-current={activeTab === 'top10' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'top10'
            ? 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        🏆 Top 10
      </button>

      <button
        onClick={() => onTabChange('coming-soon')}
        aria-current={activeTab === 'coming-soon' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'coming-soon'
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Calendar className="w-5 h-5" />
        Coming Soon
      </button>

      <button
        onClick={() => onTabChange('watchlist')}
        aria-current={activeTab === 'watchlist' ? 'page' : undefined}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all relative ${
          activeTab === 'watchlist'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Bookmark className="w-5 h-5" filled={activeTab === 'watchlist'} />
        Watchlist
        {watchlistCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-500 rounded-full text-[11px] text-white leading-none">
            {watchlistCount > 99 ? '99+' : watchlistCount}
          </span>
        )}
      </button>
    </nav>
  )
}

TabNav.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  watchlistCount: PropTypes.number,
}
