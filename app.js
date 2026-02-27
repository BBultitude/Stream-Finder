const { useState, useEffect } = React;

// Simple in-memory cache for /api/* responses (1-hour TTL, per session only).
// IMP-02 will replace this with a persistent IndexedDB cache.
const cache = {
  data: {},
  get: function(key) {
    const item = this.data[key];
    if (!item) return null;
    if (Date.now() - item.timestamp > 3600000) {
      delete this.data[key];
      return null;
    }
    return item.value;
  },
  set: function(key, value) {
    this.data[key] = { value: value, timestamp: Date.now() };
  }
};

// Build a query string from a params object, omitting undefined/null/empty values
function buildQuery(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? '?' + parts.join('&') : '';
}

// Create icon components
const Search = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('circle', { cx: '11', cy: '11', r: '8' }), React.createElement('path', { d: 'm21 21-4.3-4.3' }));

const Film = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }), React.createElement('path', { d: 'M7 3v18' }), React.createElement('path', { d: 'M3 7.5h4' }), React.createElement('path', { d: 'M3 12h18' }), React.createElement('path', { d: 'M3 16.5h4' }), React.createElement('path', { d: 'M17 3v18' }), React.createElement('path', { d: 'M17 7.5h4' }), React.createElement('path', { d: 'M17 16.5h4' }));

const Tv = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('rect', { width: '20', height: '15', x: '2', y: '7', rx: '2', ry: '2' }), React.createElement('polyline', { points: '17 2 12 7 7 2' }));

const ChevronDown = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'm6 9 6 6 6-6' }));

const X = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'M18 6 6 18' }), React.createElement('path', { d: 'm6 6 12 12' }));

const TrendingUp = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }), React.createElement('polyline', { points: '16 7 22 7 22 13' }));

const Sparkles = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' }), React.createElement('path', { d: 'M5 3v4' }), React.createElement('path', { d: 'M19 17v4' }), React.createElement('path', { d: 'M3 5h4' }), React.createElement('path', { d: 'M17 19h4' }));

const Grid = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('rect', { width: '7', height: '7', x: '3', y: '3', rx: '1' }), React.createElement('rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }), React.createElement('rect', { width: '7', height: '7', x: '14', y: '14', rx: '1' }), React.createElement('rect', { width: '7', height: '7', x: '3', y: '14', rx: '1' }));

const ArrowLeft = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'm12 19-7-7 7-7' }), React.createElement('path', { d: 'M19 12H5' }));

const STREAMING_SERVICES = [
  { id: 'netflix', name: 'Netflix', apiName: 'Netflix', providerId: 8, color: 'bg-red-600' },
  { id: 'prime', name: 'Prime Video', apiName: 'Amazon Prime Video', providerId: 9, color: 'bg-blue-500' },
  { id: 'stan', name: 'Stan', apiName: 'Stan', providerId: 21, color: 'bg-cyan-600' },
  { id: 'paramount', name: 'Paramount+', apiName: 'Paramount Plus', providerId: 531, color: 'bg-blue-700' },
  { id: 'disney', name: 'Disney+', apiName: 'Disney Plus', providerId: 337, color: 'bg-blue-600' },
  { id: 'binge', name: 'Binge', apiName: 'Binge', providerId: 385, color: 'bg-orange-500' },
  { id: 'max', name: 'Max', apiName: 'Max', providerId: 1899, color: 'bg-purple-700' }
];

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 99, name: 'Documentary' },
  { id: 18, name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' }
];

const CONTENT_TYPES = [
  { id: 'all', name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv', name: 'TV Shows' }
];

function StreamingFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [browseAll, setBrowseAll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedContentType, setSelectedContentType] = useState('all');
  const [showServiceFilters, setShowServiceFilters] = useState(false);
  const [showGenreFilters, setShowGenreFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedItem, setSelectedItem] = useState(null);
  const [similarContent, setSimilarContent] = useState([]);
  const [browseAllPage, setBrowseAllPage] = useState(1);

  // Deduplicate items by ID
  const deduplicateById = (items) => {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Returns a comma-separated string of TMDB provider IDs for the selected services,
  // or undefined if no services are selected.
  const getProviderParam = () => {
    if (selectedServices.length === 0) return undefined;
    const ids = selectedServices
      .map(id => STREAMING_SERVICES.find(s => s.id === id)?.providerId)
      .filter(Boolean);
    return ids.length ? ids.join(',') : undefined;
  };

  const loadTrendingContent = async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        type: selectedContentType !== 'all' ? selectedContentType : undefined,
        providers: getProviderParam()
      });
      const cacheKey = '/api/trending' + qs;
      const cached = cache.get(cacheKey);
      if (cached) { setTrendingContent(cached); setLoading(false); return; }

      const res = await fetch('/api/trending' + qs);
      const data = await res.json();
      const results = deduplicateById(data.results || []);
      cache.set(cacheKey, results);
      setTrendingContent(results);
    } catch (error) {
      console.error('Failed to load trending:', error);
      setTrendingContent([]);
    }
    setLoading(false);
  };

  const loadNewReleases = async () => {
    setLoading(true);
    try {
      const qs = buildQuery({
        type: selectedContentType !== 'all' ? selectedContentType : undefined,
        providers: getProviderParam()
      });
      const cacheKey = '/api/new' + qs;
      const cached = cache.get(cacheKey);
      if (cached) { setNewReleases(cached); setLoading(false); return; }

      const res = await fetch('/api/new' + qs);
      const data = await res.json();
      const results = deduplicateById(data.results || []);
      cache.set(cacheKey, results);
      setNewReleases(results);
    } catch (error) {
      console.error('Failed to load new releases:', error);
      setNewReleases([]);
    }
    setLoading(false);
  };

  const loadBrowseAll = async (page = 1) => {
    setLoading(true);
    try {
      const qs = buildQuery({
        page,
        type: selectedContentType !== 'all' ? selectedContentType : undefined,
        providers: getProviderParam()
      });
      const cacheKey = '/api/browse' + qs;
      const cached = cache.get(cacheKey);
      if (cached) {
        if (page === 1) { setBrowseAll(cached); } else { setBrowseAll(prev => deduplicateById([...prev, ...cached])); }
        setLoading(false);
        return;
      }

      const res = await fetch('/api/browse' + qs);
      const data = await res.json();
      const results = deduplicateById(data.results || []);
      cache.set(cacheKey, results);
      if (page === 1) { setBrowseAll(results); } else { setBrowseAll(prev => deduplicateById([...prev, ...results])); }
    } catch (error) {
      console.error('Failed to load browse all:', error);
      if (page === 1) setBrowseAll([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrendingContent();
    loadNewReleases();
    loadBrowseAll();
  }, []);

  // Reload all content when service or content-type filters change
  useEffect(() => {
    setBrowseAllPage(1);
    loadTrendingContent();
    loadNewReleases();
    loadBrowseAll(1);
  }, [selectedServices, selectedContentType]);

  const searchContent = async (query) => {
    if (!query.trim()) {
      setResults([]);
      setActiveTab('trending');
      return;
    }
    setActiveTab('');
    setLoading(true);
    try {
      const qs = buildQuery({ query, providers: getProviderParam() });
      const res = await fetch('/api/search' + qs);
      const data = await res.json();
      setResults(deduplicateById(data.results || []));
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    }
    setLoading(false);
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    setSimilarContent([]);
    try {
      const res = await fetch(`/api/detail/${item.media_type}/${item.id}`);
      const data = await res.json();
      if (data.imdb_id) {
        setSelectedItem(prev => ({ ...prev, imdb_id: data.imdb_id }));
      }
      if (data.recommendations) {
        setSimilarContent(deduplicateById(data.recommendations));
      }
    } catch (error) {
      console.error('Failed to load item detail:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchContent(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleService = (serviceId) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleGenre = (genreId) => {
    setSelectedGenres(prev =>
      prev.includes(genreId)
        ? prev.filter(id => id !== genreId)
        : [...prev, genreId]
    );
  };

  const filterContent = (content) => {
    let filtered = content;

    // Genre filter is applied client-side (backend returns genre_ids in all responses)
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(item =>
        item.genre_ids && item.genre_ids.some(gid => selectedGenres.includes(gid))
      );
    }

    // Content type and service filters are handled by the backend (query params),
    // but apply client-side as a safety net for any mixed results in the cache.
    if (selectedContentType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedContentType);
    }

    return deduplicateById(filtered);
  };

  const displayContent = searchQuery 
    ? filterContent(results)
    : activeTab === 'trending'
      ? filterContent(trendingContent)
      : activeTab === 'new'
      ? filterContent(newReleases)
      : filterContent(browseAll);

  if (selectedItem) {
    return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-90 z-50 overflow-y-auto' },
      React.createElement('div', { className: 'min-h-screen px-4 py-8' },
        React.createElement('div', { className: 'max-w-6xl mx-auto' },
          React.createElement('button', {
            onClick: () => setSelectedItem(null),
            className: 'mb-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white'
          },
            React.createElement(ArrowLeft, { className: 'w-5 h-5' }),
            'Back'
          ),
          React.createElement('div', { className: 'bg-gray-900 rounded-xl overflow-hidden border border-gray-800' },
            React.createElement('div', { className: 'grid md:grid-cols-3 gap-6 p-6' },
              React.createElement('div', { className: 'md:col-span-1' },
                selectedItem.poster_path ? React.createElement('img', {
                  src: `https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`,
                  alt: selectedItem.title || selectedItem.name,
                  className: 'w-full rounded-lg'
                }) : React.createElement('div', { className: 'w-full aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center' },
                  selectedItem.media_type === 'movie' ? React.createElement(Film, { className: 'w-24 h-24 text-gray-600' }) : React.createElement(Tv, { className: 'w-24 h-24 text-gray-600' })
                )
              ),
              React.createElement('div', { className: 'md:col-span-2' },
                React.createElement('h1', { className: 'text-4xl font-bold mb-4 text-white' }, selectedItem.title || selectedItem.name),
                React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
                  React.createElement('span', { className: 'px-3 py-1 bg-purple-600 rounded-full text-sm text-white' },
                    selectedItem.media_type === 'movie' ? 'Movie' : 'TV Show'
                  ),
                  selectedItem.vote_average > 0 && React.createElement('span', { className: 'px-3 py-1 bg-yellow-600 rounded-full text-sm flex items-center gap-1 text-white' },
                    `★ ${selectedItem.vote_average.toFixed(1)}`
                  ),
                  (selectedItem.release_date || selectedItem.first_air_date) && React.createElement('span', { className: 'px-3 py-1 bg-gray-700 rounded-full text-sm text-white' },
                    new Date(selectedItem.release_date || selectedItem.first_air_date).getFullYear()
                  )
                ),
                selectedItem.streaming && selectedItem.streaming.length > 0 && React.createElement('div', { className: 'mb-6' },
                  React.createElement('h3', { className: 'text-sm text-gray-300 mb-2' }, 'Available on:'),
                  React.createElement('div', { className: 'flex flex-wrap gap-2' },
                    selectedItem.streaming.map((service, idx) =>
                      React.createElement('div', { key: idx, className: 'flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg' },
                        service.logo && React.createElement('img', { src: service.logo, alt: service.name, className: 'w-6 h-6 rounded' }),
                        React.createElement('span', { className: 'text-sm text-white' }, service.name)
                      )
                    )
                  )
                ),
                (selectedItem.display_status === 'in_cinemas' || selectedItem.display_status === 'coming_soon') && React.createElement('div', {
                  className: `mb-6 px-4 py-3 rounded-lg border flex items-start gap-2 ${
                    selectedItem.display_status === 'in_cinemas'
                      ? 'bg-amber-950/50 border-amber-700/50 text-amber-300'
                      : 'bg-blue-950/50 border-blue-700/50 text-blue-300'
                  }`
                },
                  React.createElement(Film, { className: 'w-4 h-4 mt-0.5 flex-shrink-0' }),
                  React.createElement('p', { className: 'text-sm' },
                    selectedItem.display_status === 'in_cinemas'
                      ? 'Currently showing in Australian cinemas \u2014 not yet available to stream.'
                      : (() => {
                          const d = selectedItem.release_date || selectedItem.first_air_date;
                          return d
                            ? `Not yet released. Expected ${new Date(d).toLocaleDateString('en-AU', { year: 'numeric', month: 'long' })}.`
                            : 'Not yet released.';
                        })()
                  )
                ),
                React.createElement('div', { className: 'mb-6' },
                  React.createElement('h3', { className: 'text-xl font-semibold mb-2 text-white' }, 'Overview'),
                  React.createElement('p', { className: 'text-gray-300 leading-relaxed' },
                    selectedItem.overview || 'No overview available.'
                  )
                ),
                React.createElement('div', { className: 'flex gap-4' },
                  selectedItem.imdb_id && React.createElement('a', {
                    href: `https://www.imdb.com/title/${selectedItem.imdb_id}`,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-white font-medium transition-colors'
                  }, 'View on IMDb'),
                  React.createElement('a', {
                    href: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(selectedItem.title || selectedItem.name)}`,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors'
                  }, 'Search Rotten Tomatoes')
                )
              )
            ),
            similarContent.length > 0 && React.createElement('div', { className: 'px-6 pb-6' },
              React.createElement('h3', { className: 'text-2xl font-bold mb-4 text-white' }, 'Recommended For You'),
              React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' },
                similarContent.map(similar =>
                  React.createElement('div', {
                    key: similar.id,
                    onClick: () => handleItemClick(similar),
                    className: 'bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 cursor-pointer'
                  },
                    similar.poster_path ? React.createElement('img', {
                      src: `https://image.tmdb.org/t/p/w500${similar.poster_path}`,
                      alt: similar.title || similar.name,
                      className: 'w-full aspect-[2/3] object-cover'
                    }) : React.createElement('div', { className: 'w-full aspect-[2/3] bg-gray-700 flex items-center justify-center' },
                      similar.media_type === 'movie' ? React.createElement(Film, { className: 'w-12 h-12 text-gray-600' }) : React.createElement(Tv, { className: 'w-12 h-12 text-gray-600' })
                    ),
                    React.createElement('div', { className: 'p-4' },
                      React.createElement('h3', { className: 'font-semibold text-sm mb-2 line-clamp-2 text-white' }, similar.title || similar.name),
                      React.createElement('div', { className: 'flex items-center gap-2 mb-3 flex-wrap' },
                        React.createElement('span', { className: 'text-xs px-2 py-1 bg-gray-700 rounded text-white' },
                          similar.media_type === 'movie' ? 'Movie' : 'TV Show'
                        ),
                        similar.vote_average > 0 && React.createElement('span', { className: 'text-xs text-yellow-400' },
                          `★ ${similar.vote_average.toFixed(1)}`
                        )
                      ),
                      similar.streaming && similar.streaming.length > 0 ? React.createElement('div', null,
                        React.createElement('p', { className: 'text-xs text-gray-400 mb-2' }, 'Available on:'),
                        React.createElement('div', { className: 'flex flex-wrap gap-1' },
                          similar.streaming.slice(0, 3).map((service, idx) =>
                            service.logo && React.createElement('img', { key: idx, src: service.logo, alt: service.name, title: service.name, className: 'w-8 h-8 rounded object-cover' })
                          ),
                          similar.streaming.length > 3 && React.createElement('span', { className: 'text-xs text-gray-400 self-center' }, `+${similar.streaming.length - 3}`)
                        )
                      ) : React.createElement('p', { className: 'text-xs text-gray-500 italic' }, 'No streaming info')
                    )
                  )
                )
              )
            )
          )
        )
      )
    );
  }

  return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white' },
    React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-8' },
      React.createElement('div', { className: 'text-center mb-12' },
        React.createElement('h1', { className: 'text-5xl font-bold mb-3 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-transparent bg-clip-text' }, 'Stream Finder'),
        React.createElement('p', { className: 'text-gray-300' }, 'Find what to watch across all Australian streaming platforms')
      ),
      React.createElement('div', { className: 'max-w-3xl mx-auto mb-8' },
        React.createElement('div', { className: 'relative' },
          React.createElement(Search, { className: 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5' }),
          React.createElement('input', {
            type: 'text',
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: 'Search for movies or TV shows...',
            className: 'w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all'
          })
        )
      ),
      React.createElement('div', { className: 'max-w-3xl mx-auto mb-8 space-y-4' },
        React.createElement('div', null,
          React.createElement('button', {
            onClick: () => setShowServiceFilters(!showServiceFilters),
            className: 'flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white'
          },
            React.createElement('span', null, 'Filter by Streaming Service'),
            selectedServices.length > 0 && React.createElement('span', { className: 'px-2 py-0.5 bg-purple-600 rounded text-xs text-white' }, selectedServices.length),
            React.createElement(ChevronDown, { className: `w-4 h-4 transition-transform ${showServiceFilters ? 'rotate-180' : ''}` })
          ),
          showServiceFilters && React.createElement('div', { className: 'mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700' },
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              STREAMING_SERVICES.map(service =>
                React.createElement('button', {
                  key: service.id,
                  onClick: () => toggleService(service.id),
                  className: `px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedServices.includes(service.id)
                      ? `${service.color} text-white shadow-lg scale-105`
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`
                }, service.name)
              )
            )
          )
        ),
        React.createElement('div', null,
          React.createElement('button', {
            onClick: () => setShowGenreFilters(!showGenreFilters),
            className: 'flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white'
          },
            React.createElement('span', null, 'Filter by Genre'),
            selectedGenres.length > 0 && React.createElement('span', { className: 'px-2 py-0.5 bg-purple-600 rounded text-xs text-white' }, selectedGenres.length),
            React.createElement(ChevronDown, { className: `w-4 h-4 transition-transform ${showGenreFilters ? 'rotate-180' : ''}` })
          ),
          showGenreFilters && React.createElement('div', { className: 'mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700' },
            React.createElement('div', { className: 'flex flex-wrap gap-2' },
              GENRES.map(genre =>
                React.createElement('button', {
                  key: genre.id,
                  onClick: () => toggleGenre(genre.id),
                  className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedGenres.includes(genre.id)
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`
                }, genre.name)
              )
            )
          )
        ),
        React.createElement('div', { className: 'flex flex-wrap gap-2' },
          React.createElement('span', { className: 'text-sm text-gray-300 self-center' }, 'Content Type:'),
          CONTENT_TYPES.map(type =>
            React.createElement('button', {
              key: type.id,
              onClick: () => setSelectedContentType(type.id),
              className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedContentType === type.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`
            }, type.name)
          )
        ),
        (selectedServices.length > 0 || selectedGenres.length > 0 || selectedContentType !== 'all') && React.createElement('button', {
          onClick: () => {
            setSelectedServices([]);
            setSelectedGenres([]);
            setSelectedContentType('all');
          },
          className: 'text-sm text-gray-300 hover:text-white flex items-center gap-1'
        },
          React.createElement(X, { className: 'w-3 h-3' }),
          'Clear all filters'
        )
      ),
      !searchQuery && React.createElement('div', { className: 'max-w-3xl mx-auto mb-8 flex gap-4 flex-wrap' },
        React.createElement('button', {
          onClick: () => setActiveTab('trending'),
          className: `flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'trending'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`
        },
          React.createElement(TrendingUp, { className: 'w-5 h-5' }),
          "What's Hot"
        ),
        React.createElement('button', {
          onClick: () => setActiveTab('new'),
          className: `flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'new'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`
        },
          React.createElement(Sparkles, { className: 'w-5 h-5' }),
          "What's New"
        ),
        React.createElement('button', {
          onClick: () => setActiveTab('browse'),
          className: `flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'browse'
              ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg'
              : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
          }`
        },
          React.createElement(Grid, { className: 'w-5 h-5' }),
          'Browse All'
        )
      ),
      loading && React.createElement('div', { className: 'text-center py-12' },
        React.createElement('div', { className: 'inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin' })
      ),
      !loading && displayContent.length > 0 && React.createElement(React.Fragment, null,
        searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6 text-white' }, 'Search Results'),
        !searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6 text-white' },
          activeTab === 'trending' ? "🔥 What's Hot This Week" :
          activeTab === 'new' ? "✨ New Releases" :
          "🎬 Browse All Content"
        ),
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' },
          displayContent.map(item =>
            React.createElement('div', {
              key: item.id,
              onClick: () => handleItemClick(item),
              className: 'bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500 cursor-pointer'
            },
              item.poster_path ? React.createElement('img', {
                src: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
                alt: item.title || item.name,
                className: 'w-full aspect-[2/3] object-cover'
              }) : React.createElement('div', { className: 'w-full aspect-[2/3] bg-gray-700 flex items-center justify-center' },
                item.media_type === 'movie' ? React.createElement(Film, { className: 'w-12 h-12 text-gray-600' }) : React.createElement(Tv, { className: 'w-12 h-12 text-gray-600' })
              ),
              React.createElement('div', { className: 'p-4' },
                React.createElement('h3', { className: 'font-semibold text-sm mb-2 line-clamp-2 text-white' }, item.title || item.name),
                React.createElement('div', { className: 'flex items-center gap-2 mb-3 flex-wrap' },
                  React.createElement('span', { className: 'text-xs px-2 py-1 bg-gray-700 rounded text-white' },
                    item.media_type === 'movie' ? 'Movie' : 'TV Show'
                  ),
                  item.vote_average > 0 && React.createElement('span', { className: 'text-xs text-yellow-400' },
                    `★ ${item.vote_average.toFixed(1)}`
                  ),
                  item.display_status === 'in_cinemas' && React.createElement('span', { className: 'text-xs px-2 py-1 bg-amber-700 rounded text-amber-100 flex items-center gap-1' },
                    React.createElement(Film, { className: 'w-3 h-3' }),
                    'In Cinemas'
                  )
                ),
                item.streaming && item.streaming.length > 0 ? React.createElement('div', null,
                  React.createElement('p', { className: 'text-xs text-gray-400 mb-2' }, 'Available on:'),
                  React.createElement('div', { className: 'flex flex-wrap gap-1' },
                    item.streaming.slice(0, 3).map((service, idx) =>
                      service.logo && React.createElement('img', { key: idx, src: service.logo, alt: service.name, title: service.name, className: 'w-8 h-8 rounded object-cover' })
                    ),
                    item.streaming.length > 3 && React.createElement('span', { className: 'text-xs text-gray-400 self-center' }, `+${item.streaming.length - 3}`)
                  )
                ) : item.display_status !== 'in_cinemas' && React.createElement('p', { className: 'text-xs text-gray-500 italic' }, 'No streaming info')
              )
            )
          )
        ),
        activeTab === 'browse' && !searchQuery && !loading && React.createElement('div', { className: 'text-center mt-8' },
          React.createElement('button', {
            onClick: () => {
              const nextPage = browseAllPage + 1;
              setBrowseAllPage(nextPage);
              loadBrowseAll(nextPage);
            },
            className: 'px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-white'
          }, 'Load More')
        )
      ),
      !loading && displayContent.length === 0 && (searchQuery || selectedServices.length > 0 || selectedGenres.length > 0 || selectedContentType !== 'all') && React.createElement('div', { className: 'text-center py-12 text-gray-300' },
        React.createElement('p', null, 'No results match your filters.'),
        React.createElement('button', {
          onClick: () => {
            setSelectedServices([]);
            setSelectedGenres([]);
            setSelectedContentType('all');
            setSearchQuery('');
          },
          className: 'mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors'
        }, 'Clear Filters')
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(StreamingFinder));
