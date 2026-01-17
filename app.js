const { useState, useEffect } = React;

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
  { id: 'netflix', name: 'Netflix', apiName: 'Netflix', color: 'bg-red-600' },
  { id: 'prime', name: 'Prime Video', apiName: 'Amazon Prime Video', color: 'bg-blue-500' },
  { id: 'stan', name: 'Stan', apiName: 'Stan', color: 'bg-cyan-600' },
  { id: 'paramount', name: 'Paramount+', apiName: 'Paramount Plus', color: 'bg-blue-700' },
  { id: 'disney', name: 'Disney+', apiName: 'Disney Plus', color: 'bg-blue-600' },
  { id: 'binge', name: 'Binge', apiName: 'Binge', color: 'bg-orange-500' },
  { id: 'max', name: 'Max', apiName: 'Max', color: 'bg-purple-700' },
  { id: '7plus', name: '7plus', apiName: '7plus', color: 'bg-red-500' },
  { id: '9now', name: '9Now', apiName: '9Now', color: 'bg-blue-400' },
  { id: '10play', name: '10 play', apiName: '10 play', color: 'bg-teal-500' },
  { id: 'sbs', name: 'SBS On Demand', apiName: 'SBS On Demand', color: 'bg-yellow-600' },
  { id: 'abc', name: 'ABC iview', apiName: 'ABC iview', color: 'bg-gray-600' }
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

  const fetchWithStreaming = async (items) => {
    return await Promise.all(
      items.map(async (item) => {
        try {
          const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
          const providers = await fetch(
            `https://api.themoviedb.org/3/${mediaType}/${item.id}/watch/providers?api_key=8265bd1679663a7ea12ac168da84d2e8`
          );
          const providerData = await providers.json();
          const auProviders = providerData.results?.AU?.flatrate || [];
          
          return {
            ...item,
            media_type: mediaType,
            streaming: auProviders.map(p => ({
              name: p.provider_name,
              logo: `https://image.tmdb.org/t/p/original${p.logo_path}`
            }))
          };
        } catch {
          return { ...item, streaming: [] };
        }
      })
    );
  };

  const loadTrendingContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'https://api.themoviedb.org/3/trending/all/week?api_key=8265bd1679663a7ea12ac168da84d2e8'
      );
      const data = await response.json();
      const withStreaming = await fetchWithStreaming(
        data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv').slice(0, 20)
      );
      setTrendingContent(withStreaming);
    } catch (error) {
      console.error('Failed to load trending:', error);
    }
    setLoading(false);
  };

  const loadNewReleases = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const threeMonthsAgo = new Date(today.setMonth(today.getMonth() - 3));
      const dateStr = threeMonthsAgo.toISOString().split('T')[0];
      
      const moviesRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=8265bd1679663a7ea12ac168da84d2e8&sort_by=release_date.desc&release_date.gte=${dateStr}&vote_count.gte=10`);
      const tvRes = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=8265bd1679663a7ea12ac168da84d2e8&sort_by=first_air_date.desc&first_air_date.gte=${dateStr}&vote_count.gte=10`);
      
      const movies = await moviesRes.json();
      const tv = await tvRes.json();
      
      const combined = [
        ...movies.results.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })),
        ...tv.results.slice(0, 10).map(t => ({ ...t, media_type: 'tv' }))
      ].sort((a, b) => {
        const dateA = new Date(a.release_date || a.first_air_date);
        const dateB = new Date(b.release_date || b.first_air_date);
        return dateB - dateA;
      });
      
      const withStreaming = await fetchWithStreaming(combined.slice(0, 20));
      setNewReleases(withStreaming);
    } catch (error) {
      console.error('Failed to load new releases:', error);
    }
    setLoading(false);
  };

  const loadBrowseAll = async (page = 1) => {
    setLoading(true);
    try {
      const movieRes = await fetch(`https://api.themoviedb.org/3/discover/movie?api_key=8265bd1679663a7ea12ac168da84d2e8&sort_by=popularity.desc&page=${page}`);
      const tvRes = await fetch(`https://api.themoviedb.org/3/discover/tv?api_key=8265bd1679663a7ea12ac168da84d2e8&sort_by=popularity.desc&page=${page}`);
      
      const movies = await movieRes.json();
      const tv = await tvRes.json();
      
      const combined = [
        ...movies.results.slice(0, 10).map(m => ({ ...m, media_type: 'movie' })),
        ...tv.results.slice(0, 10).map(t => ({ ...t, media_type: 'tv' }))
      ];
      
      const withStreaming = await fetchWithStreaming(combined);
      if (page === 1) {
        setBrowseAll(withStreaming);
      } else {
        setBrowseAll(prev => [...prev, ...withStreaming]);
      }
    } catch (error) {
      console.error('Failed to load browse all:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTrendingContent();
    loadNewReleases();
    loadBrowseAll();
  }, []);

  const searchContent = async (query) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=8265bd1679663a7ea12ac168da84d2e8&language=en-US&query=${encodeURIComponent(query)}&page=1`
      );
      const data = await response.json();
      
      const resultsWithStreaming = await fetchWithStreaming(
        data.results
          .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
          .slice(0, 20)
      );
      
      setResults(resultsWithStreaming);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  const loadSimilarContent = async (item) => {
    try {
      // Try recommendations API first (better quality, based on user behavior)
      let response = await fetch(
        `https://api.themoviedb.org/3/${item.media_type}/${item.id}/recommendations?api_key=8265bd1679663a7ea12ac168da84d2e8&page=1`
      );
      let data = await response.json();
      
      // If no recommendations, fall back to similar API
      if (!data.results || data.results.length === 0) {
        response = await fetch(
          `https://api.themoviedb.org/3/${item.media_type}/${item.id}/similar?api_key=8265bd1679663a7ea12ac168da84d2e8&page=1`
        );
        data = await response.json();
      }
      
      const withStreaming = await fetchWithStreaming(
        data.results.slice(0, 12).map(r => ({ ...r, media_type: item.media_type }))
      );
      setSimilarContent(withStreaming);
    } catch (error) {
      console.error('Failed to load similar content:', error);
      setSimilarContent([]);
    }
  };

  const handleItemClick = async (item) => {
    setSelectedItem(item);
    await loadSimilarContent(item);
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

    if (selectedServices.length > 0) {
      filtered = filtered.filter(item =>
        item.streaming.some(s =>
          selectedServices.some(selectedId => {
            const service = STREAMING_SERVICES.find(srv => srv.id === selectedId);
            return s.name.toLowerCase().includes(service.apiName.toLowerCase()) ||
                   s.name === service.apiName;
          })
        )
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(item =>
        item.genre_ids && item.genre_ids.some(gid => selectedGenres.includes(gid))
      );
    }

    if (selectedContentType !== 'all') {
      filtered = filtered.filter(item => item.media_type === selectedContentType);
    }

    return filtered;
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
            className: 'mb-4 flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors'
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
                React.createElement('h1', { className: 'text-4xl font-bold mb-4' }, selectedItem.title || selectedItem.name),
                React.createElement('div', { className: 'flex flex-wrap gap-2 mb-4' },
                  React.createElement('span', { className: 'px-3 py-1 bg-purple-600 rounded-full text-sm' },
                    selectedItem.media_type === 'movie' ? 'Movie' : 'TV Show'
                  ),
                  selectedItem.vote_average > 0 && React.createElement('span', { className: 'px-3 py-1 bg-yellow-600 rounded-full text-sm flex items-center gap-1' },
                    `★ ${selectedItem.vote_average.toFixed(1)}`
                  ),
                  (selectedItem.release_date || selectedItem.first_air_date) && React.createElement('span', { className: 'px-3 py-1 bg-gray-700 rounded-full text-sm' },
                    new Date(selectedItem.release_date || selectedItem.first_air_date).getFullYear()
                  )
                ),
                selectedItem.streaming && selectedItem.streaming.length > 0 && React.createElement('div', { className: 'mb-6' },
                  React.createElement('h3', { className: 'text-sm text-gray-400 mb-2' }, 'Available on:'),
                  React.createElement('div', { className: 'flex flex-wrap gap-2' },
                    selectedItem.streaming.map((service, idx) =>
                      React.createElement('div', { key: idx, className: 'flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg' },
                        React.createElement('img', { src: service.logo, alt: service.name, className: 'w-6 h-6 rounded' }),
                        React.createElement('span', { className: 'text-sm' }, service.name)
                      )
                    )
                  )
                ),
                React.createElement('div', { className: 'mb-6' },
                  React.createElement('h3', { className: 'text-xl font-semibold mb-2' }, 'Overview'),
                  React.createElement('p', { className: 'text-gray-300 leading-relaxed' },
                    selectedItem.overview || 'No overview available.'
                  )
                )
              )
            ),
            similarContent.length > 0 && React.createElement('div', { className: 'px-6 pb-6' },
              React.createElement('h3', { className: 'text-2xl font-bold mb-4' }, 'Recommended For You'),
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
                      React.createElement('h3', { className: 'font-semibold text-sm mb-2 line-clamp-2' }, similar.title || similar.name),
                      React.createElement('div', { className: 'flex items-center gap-2 mb-3 flex-wrap' },
                        React.createElement('span', { className: 'text-xs px-2 py-1 bg-gray-700 rounded' },
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
                            React.createElement('img', { key: idx, src: service.logo, alt: service.name, title: service.name, className: 'w-8 h-8 rounded object-cover' })
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
        React.createElement('p', { className: 'text-gray-400' }, 'Find what to watch across all Australian streaming platforms')
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
            className: 'flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors'
          },
            React.createElement('span', null, 'Filter by Streaming Service'),
            selectedServices.length > 0 && React.createElement('span', { className: 'px-2 py-0.5 bg-purple-600 rounded text-xs' }, selectedServices.length),
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
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`
                }, service.name)
              )
            )
          )
        ),
        React.createElement('div', null,
          React.createElement('button', {
            onClick: () => setShowGenreFilters(!showGenreFilters),
            className: 'flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors'
          },
            React.createElement('span', null, 'Filter by Genre'),
            selectedGenres.length > 0 && React.createElement('span', { className: 'px-2 py-0.5 bg-purple-600 rounded text-xs' }, selectedGenres.length),
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
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`
                }, genre.name)
              )
            )
          )
        ),
        React.createElement('div', { className: 'flex flex-wrap gap-2' },
          React.createElement('span', { className: 'text-sm text-gray-400 self-center' }, 'Content Type:'),
          CONTENT_TYPES.map(type =>
            React.createElement('button', {
              key: type.id,
              onClick: () => setSelectedContentType(type.id),
              className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedContentType === type.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
          className: 'text-sm text-gray-400 hover:text-white flex items-center gap-1'
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
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
        searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Search Results'),
        !searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6' },
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
                React.createElement('h3', { className: 'font-semibold text-sm mb-2 line-clamp-2' }, item.title || item.name),
                React.createElement('div', { className: 'flex items-center gap-2 mb-3 flex-wrap' },
                  React.createElement('span', { className: 'text-xs px-2 py-1 bg-gray-700 rounded' },
                    item.media_type === 'movie' ? 'Movie' : 'TV Show'
                  ),
                  item.vote_average > 0 && React.createElement('span', { className: 'text-xs text-yellow-400' },
                    `★ ${item.vote_average.toFixed(1)}`
                  )
                ),
                item.streaming && item.streaming.length > 0 ? React.createElement('div', null,
                  React.createElement('p', { className: 'text-xs text-gray-400 mb-2' }, 'Available on:'),
                  React.createElement('div', { className: 'flex flex-wrap gap-1' },
                    item.streaming.slice(0, 3).map((service, idx) =>
                      React.createElement('img', { key: idx, src: service.logo, alt: service.name, title: service.name, className: 'w-8 h-8 rounded object-cover' })
                    ),
                    item.streaming.length > 3 && React.createElement('span', { className: 'text-xs text-gray-400 self-center' }, `+${item.streaming.length - 3}`)
                  )
                ) : React.createElement('p', { className: 'text-xs text-gray-500 italic' }, 'No streaming info')
              )
            )
          )
        ),
        activeTab === 'browse' && !searchQuery && React.createElement('div', { className: 'text-center mt-8' },
          React.createElement('button', {
            onClick: () => {
              const nextPage = browseAllPage + 1;
              setBrowseAllPage(nextPage);
              loadBrowseAll(nextPage);
            },
            className: 'px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors'
          }, 'Load More')
        )
      ),
      !loading && displayContent.length === 0 && (searchQuery || selectedServices.length > 0 || selectedGenres.length > 0 || selectedContentType !== 'all') && React.createElement('div', { className: 'text-center py-12 text-gray-400' },
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
