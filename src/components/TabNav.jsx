import { TrendingUp, Sparkles, Grid, Bookmark, Calendar } from './icons'

export default function TabNav({ activeTab, onTabChange, watchlistCount }) {
  return (
    <div className="max-w-4xl mx-auto mb-8 flex gap-3 flex-wrap">
      <button
        onClick={() => onTabChange('trending')}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'trending'
            ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <TrendingUp className="w-5 h-5" />
        What&apos;s Hot
      </button>

      <button
        onClick={() => onTabChange('new')}
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
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'browse'
            ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        <Grid className="w-5 h-5" />
        Browse All
      </button>

      <button
        onClick={() => onTabChange('top10')}
        className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
          activeTab === 'top10'
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
            : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
        }`}
      >
        🏆 Top 10
      </button>

      <button
        onClick={() => onTabChange('coming-soon')}
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
    </div>
  )
}
