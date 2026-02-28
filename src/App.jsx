import { useState, useEffect, useRef, useMemo } from 'react'
import { fetchTrending, fetchNew, fetchBrowse, fetchTop10, fetchSearch, fetchDetail, fetchComingSoon } from './services/apiService'
import { getWatchlist, addToWatchlist, removeFromWatchlist, clearWatchlist } from './services/watchlistService'
import { getSearchHistory, addToSearchHistory, removeFromSearchHistory, clearSearchHistory } from './services/searchHistoryService'
import { STREAMING_SERVICES } from './components/FilterBar'
import FilterBar from './components/FilterBar'
import TabNav from './components/TabNav'
import ContentCard from './components/ContentCard'
import Top10List from './components/Top10List'
import DetailModal from './components/DetailModal'
import WatchlistTab from './components/WatchlistTab'
import ComingSoonTab from './components/ComingSoonTab'
import { SkeletonCard, SkeletonTop10Row } from './components/SkeletonCard'
import BottomNav from './components/BottomNav'
import FilterSheet from './components/FilterSheet'
import { Search } from './components/icons'

function deduplicateById(items) {
  const seen = new Set()
  return items.filter(item => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export default function App() {
  const [searchQuery, setSearchQuery]         = useState('')
  const [results, setResults]                 = useState([])
  const [trendingContent, setTrendingContent] = useState([])
  const [newReleases, setNewReleases]         = useState([])
  const [browseAll, setBrowseAll]             = useState([])
  const [top10Content, setTop10Content]       = useState([])
  const [comingSoonContent, setComingSoonContent] = useState([])
  const [loading, setLoading]                 = useState(false)
  const [selectedServices, setSelectedServices]           = useState([])
  const [selectedGenres, setSelectedGenres]               = useState([])
  const [selectedContentType, setSelectedContentType]     = useState('all')
  const [selectedDecade, setSelectedDecade]               = useState(null)
  const [selectedMinRating, setSelectedMinRating]         = useState(0)
  const [activeTab, setActiveTab]             = useState('trending')
  const [selectedItem, setSelectedItem]       = useState(null)
  const [similarContent, setSimilarContent]   = useState([])
  const [browseAllPage, setBrowseAllPage]     = useState(1)
  const [loadingDetail, setLoadingDetail]     = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [watchlist, setWatchlist]             = useState([])
  const [searchHistory, setSearchHistory]     = useState([])
  const [searchFocused, setSearchFocused]     = useState(false)
  const searchInputRef = useRef(null)

  const watchlistKeys = useMemo(
    () => new Set(watchlist.map(i => `${i.media_type}:${i.id}`)),
    [watchlist]
  )

  // Build comma-separated provider IDs for selected services.
  // Services may map to multiple TMDB provider IDs (e.g. Prime Video uses 119 + 9 + 2100 in AU).
  const getProviderParam = () => {
    if (selectedServices.length === 0) return undefined
    const ids = selectedServices.flatMap(id => {
      const svc = STREAMING_SERVICES.find(s => s.id === id)
      return svc?.providerIds || (svc?.providerId ? [svc.providerId] : [])
    })
    return ids.length ? ids.join(',') : undefined
  }

  const loadTop10 = async () => {
    try {
      const items = await fetchTop10({ type: selectedContentType })
      setTop10Content(items)
    } catch {
      setTop10Content([])
    }
  }

  const loadComingSoon = async () => {
    try {
      const items = await fetchComingSoon({ type: selectedContentType })
      setComingSoonContent(items)
    } catch {
      setComingSoonContent([])
    }
  }

  const loadTrendingContent = async () => {
    setLoading(true)
    try {
      const items = await fetchTrending({ type: selectedContentType, providers: getProviderParam() })
      setTrendingContent(deduplicateById(items))
    } catch {
      setTrendingContent([])
    }
    setLoading(false)
  }

  const loadNewReleases = async () => {
    setLoading(true)
    try {
      const items = await fetchNew({ type: selectedContentType, providers: getProviderParam() })
      setNewReleases(deduplicateById(items))
    } catch {
      setNewReleases([])
    }
    setLoading(false)
  }

  const loadBrowseAll = async (page = 1) => {
    setLoading(true)
    try {
      const items = await fetchBrowse({ page, type: selectedContentType, providers: getProviderParam(), decade: selectedDecade })
      const deduped = deduplicateById(items)
      if (page === 1) {
        setBrowseAll(deduped)
      } else {
        setBrowseAll(prev => deduplicateById([...prev, ...deduped]))
      }
    } catch {
      if (page === 1) setBrowseAll([])
    }
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    loadTop10()
    loadTrendingContent()
    loadNewReleases()
    loadBrowseAll()
    loadComingSoon()
    getWatchlist().then(setWatchlist).catch(() => {})
    getSearchHistory().then(setSearchHistory).catch(() => {})
  }, [])

  // Reload on filter changes (service and content type affect all tabs server-side)
  useEffect(() => {
    setBrowseAllPage(1)
    loadTop10()
    loadTrendingContent()
    loadNewReleases()
    loadBrowseAll(1)
    loadComingSoon()
  }, [selectedServices, selectedContentType])

  // Reload browse when decade changes (decade is a server-side param for paginated browse)
  useEffect(() => {
    setBrowseAllPage(1)
    loadBrowseAll(1)
  }, [selectedDecade])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchContent(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const searchContent = async (query) => {
    if (!query.trim()) {
      setResults([])
      setActiveTab('trending')
      return
    }
    setActiveTab('')
    setLoading(true)
    try {
      const items = await fetchSearch(query, { providers: getProviderParam() })
      setResults(deduplicateById(items))
      // Save to history after a successful search
      addToSearchHistory(query).then(() =>
        getSearchHistory().then(setSearchHistory).catch(() => {})
      ).catch(() => {})
    } catch {
      setResults([])
    }
    setLoading(false)
  }

  const handleItemClick = async (item) => {
    setSelectedItem(item)
    setSimilarContent([])
    setLoadingDetail(true)
    try {
      const data = await fetchDetail(item.media_type, item.id)
      if (data.imdb_id || data.trailer_key !== undefined || data.cast) {
        setSelectedItem(prev => ({
          ...prev,
          imdb_id: data.imdb_id || prev.imdb_id,
          trailer_key: data.trailer_key || null,
          cast: data.cast || []
        }))
      }
      if (data.recommendations) {
        setSimilarContent(deduplicateById(data.recommendations))
      }
    } catch {
      // detail enrichment is best-effort; item already shown
    }
    setLoadingDetail(false)
  }

  const toggleWatchlist = async (item) => {
    const key = `${item.media_type}:${item.id}`
    if (watchlistKeys.has(key)) {
      await removeFromWatchlist(item.id, item.media_type).catch(() => {})
      setWatchlist(prev => prev.filter(i => `${i.media_type}:${i.id}` !== key))
    } else {
      await addToWatchlist(item).catch(() => {})
      setWatchlist(prev => [...prev, item])
    }
  }

  const handleClearWatchlist = async () => {
    if (!window.confirm(`Clear all ${watchlist.length} item${watchlist.length !== 1 ? 's' : ''} from your watchlist?`)) return
    await clearWatchlist().catch(() => {})
    setWatchlist([])
  }

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }

  const filterContent = (content) => {
    let filtered = content
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(item =>
        item.genre_ids && item.genre_ids.some(gid => selectedGenres.includes(gid))
      )
    }
    if (selectedContentType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedContentType)
    }
    if (selectedDecade !== null) {
      filtered = filtered.filter(item => {
        const dateStr = item.release_date || item.first_air_date
        if (!dateStr) return false
        const year = new Date(dateStr).getFullYear()
        return year >= selectedDecade && year <= selectedDecade + 9
      })
    }
    if (selectedMinRating > 0) {
      filtered = filtered.filter(item => item.vote_average >= selectedMinRating)
    }
    return deduplicateById(filtered)
  }

  const displayContent = searchQuery
    ? filterContent(results)
    : activeTab === 'trending'    ? filterContent(trendingContent)
    : activeTab === 'new'         ? filterContent(newReleases)
    : activeTab === 'top10'       ? filterContent(top10Content)
    : activeTab === 'watchlist'   ? []
    : activeTab === 'coming-soon' ? []
    : filterContent(browseAll)

  if (selectedItem) {
    return (
      <DetailModal
        item={selectedItem}
        similarContent={similarContent}
        loadingDetail={loadingDetail}
        onClose={() => setSelectedItem(null)}
        onSimilarClick={handleItemClick}
        isInWatchlist={watchlistKeys.has(`${selectedItem.media_type}:${selectedItem.id}`)}
        onWatchlistToggle={toggleWatchlist}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Mobile bottom nav */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setSearchQuery('') }}
        onSearchFocus={() => searchInputRef.current?.focus()}
        watchlistCount={watchlist.length}
      />

      {/* Mobile filter bottom sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        selectedServices={selectedServices}
        onServiceToggle={toggleService}
        selectedGenres={selectedGenres}
        onGenreToggle={toggleGenre}
        selectedContentType={selectedContentType}
        onContentTypeChange={setSelectedContentType}
        selectedDecade={selectedDecade}
        onDecadeChange={setSelectedDecade}
        selectedMinRating={selectedMinRating}
        onMinRatingChange={setSelectedMinRating}
        onClearAll={() => {
          setSelectedServices([])
          setSelectedGenres([])
          setSelectedContentType('all')
          setSelectedDecade(null)
          setSelectedMinRating(0)
        }}
      />

      {/* Main content — pb-20 accounts for bottom nav height on mobile */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-transparent bg-clip-text">
            Stream Finder
          </h1>
          <p className="text-gray-300">Find what to watch across all Australian streaming platforms</p>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                placeholder="Search for movies or TV shows..."
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              {/* Search history dropdown */}
              {searchFocused && !searchQuery && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                    <span className="text-xs text-gray-400 font-medium">Recent searches</span>
                    <button
                      onClick={() => { clearSearchHistory().catch(() => {}); setSearchHistory([]) }}
                      className="text-xs text-gray-500 hover:text-white transition-colors"
                    >
                      Clear all
                    </button>
                  </div>
                  {searchHistory.map(query => (
                    <div key={query} className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 transition-colors group">
                      <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <button
                        className="flex-1 text-left text-sm text-gray-200 truncate"
                        onClick={() => setSearchQuery(query)}
                      >
                        {query}
                      </button>
                      <button
                        onClick={() => {
                          removeFromSearchHistory(query).catch(() => {})
                          setSearchHistory(prev => prev.filter(q => q !== query))
                        }}
                        className="text-gray-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Filter button — mobile only */}
            <button
              onClick={() => setFilterSheetOpen(true)}
              className="md:hidden flex items-center gap-1 px-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-gray-300 hover:text-white hover:border-purple-500 transition-all relative"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              {(selectedServices.length > 0 || selectedGenres.length > 0 || selectedContentType !== 'all' || selectedDecade !== null || selectedMinRating > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full text-[10px] flex items-center justify-center text-white">
                  {selectedServices.length + selectedGenres.length +
                    (selectedContentType !== 'all' ? 1 : 0) +
                    (selectedDecade !== null ? 1 : 0) +
                    (selectedMinRating > 0 ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filters — desktop only */}
        <div className="hidden md:block">
          <FilterBar
            selectedServices={selectedServices}
            onServiceToggle={toggleService}
            selectedGenres={selectedGenres}
            onGenreToggle={toggleGenre}
            selectedContentType={selectedContentType}
            onContentTypeChange={setSelectedContentType}
            selectedDecade={selectedDecade}
            onDecadeChange={setSelectedDecade}
            selectedMinRating={selectedMinRating}
            onMinRatingChange={setSelectedMinRating}
            onClearAll={() => {
              setSelectedServices([])
              setSelectedGenres([])
              setSelectedContentType('all')
              setSelectedDecade(null)
              setSelectedMinRating(0)
            }}
          />
        </div>

        {/* Tab navigation — desktop only (mobile uses BottomNav) */}
        {!searchQuery && (
          <div className="hidden md:block">
            <TabNav activeTab={activeTab} onTabChange={setActiveTab} watchlistCount={watchlist.length} />
          </div>
        )}

        {/* Watchlist section */}
        {activeTab === 'watchlist' && !searchQuery && (
          <WatchlistTab
            items={watchlist}
            watchlistKeys={watchlistKeys}
            onItemClick={handleItemClick}
            onWatchlistToggle={toggleWatchlist}
            onClearAll={handleClearWatchlist}
          />
        )}

        {/* Coming Soon section */}
        {activeTab === 'coming-soon' && !searchQuery && (
          <ComingSoonTab
            items={comingSoonContent}
            watchlistKeys={watchlistKeys}
            onItemClick={handleItemClick}
            onWatchlistToggle={toggleWatchlist}
          />
        )}

        {/* Top 10 skeleton */}
        {loading && activeTab === 'top10' && !searchQuery && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-white">🏆 Top 10 in Australia</h2>
            <div className="space-y-3 max-w-3xl mx-auto">
              {Array.from({ length: 10 }).map((_, i) => <SkeletonTop10Row key={i} />)}
            </div>
          </>
        )}

        {/* Top 10 section */}
        {!loading && activeTab === 'top10' && !searchQuery && (
          <>
            <h2 className="text-2xl font-bold mb-6 text-white">🏆 Top 10 in Australia</h2>
            <Top10List items={displayContent} onItemClick={handleItemClick} />
          </>
        )}

        {/* Grid skeleton */}
        {loading && activeTab !== 'top10' && activeTab !== 'watchlist' && activeTab !== 'coming-soon' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 20 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Content grid */}
        {!loading && displayContent.length > 0 && activeTab !== 'top10' && activeTab !== 'watchlist' && activeTab !== 'coming-soon' && (
          <>
            {searchQuery && (
              <h2 className="text-2xl font-bold mb-6 text-white">Search Results</h2>
            )}
            {!searchQuery && (
              <h2 className="text-2xl font-bold mb-6 text-white">
                {activeTab === 'trending' ? "🔥 What's Hot This Week"
                  : activeTab === 'new' ? "✨ New Releases"
                  : "🎬 Browse All Content"}
              </h2>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayContent.map(item => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onClick={handleItemClick}
                  watchlistKeys={watchlistKeys}
                  onWatchlistToggle={toggleWatchlist}
                />
              ))}
            </div>

            {activeTab === 'browse' && !searchQuery && !loading && (
              <div className="text-center mt-8">
                <button
                  onClick={() => {
                    const nextPage = browseAllPage + 1
                    setBrowseAllPage(nextPage)
                    loadBrowseAll(nextPage)
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-white"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && displayContent.length === 0 &&
          activeTab !== 'watchlist' &&
          activeTab !== 'coming-soon' &&
          (searchQuery || selectedServices.length > 0 || selectedGenres.length > 0 || selectedContentType !== 'all') && (
          <div className="text-center py-12 text-gray-300">
            <p className="text-xl mb-2">No results found</p>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}

      </div>
    </div>
  )
}
