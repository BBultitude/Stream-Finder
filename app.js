const { useState, useEffect } = React;

// Create icon components since we're using CDN
const Search = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('circle', { cx: '11', cy: '11', r: '8' }), React.createElement('path', { d: 'm21 21-4.3-4.3' }));

const Film = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }), React.createElement('path', { d: 'M7 3v18' }), React.createElement('path', { d: 'M3 7.5h4' }), React.createElement('path', { d: 'M3 12h18' }), React.createElement('path', { d: 'M3 16.5h4' }), React.createElement('path', { d: 'M17 3v18' }), React.createElement('path', { d: 'M17 7.5h4' }), React.createElement('path', { d: 'M17 16.5h4' }));

const Tv = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('rect', { width: '20', height: '15', x: '2', y: '7', rx: '2', ry: '2' }), React.createElement('polyline', { points: '17 2 12 7 7 2' }));

const ChevronDown = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'm6 9 6 6 6-6' }));

const X = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'M18 6 6 18' }), React.createElement('path', { d: 'm6 6 12 12' }));

const TrendingUp = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('polyline', { points: '22 7 13.5 15.5 8.5 10.5 2 17' }), React.createElement('polyline', { points: '16 7 22 7 22 13' }));

const Sparkles = (props) => React.createElement('svg', { xmlns: 'http://www.w3.org/2000/svg', width: '24', height: '24', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', className: props.className }, React.createElement('path', { d: 'm12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z' }), React.createElement('path', { d: 'M5 3v4' }), React.createElement('path', { d: 'M19 17v4' }), React.createElement('path', { d: 'M3 5h4' }), React.createElement('path', { d: 'M17 19h4' }));

const STREAMING_SERVICES = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'prime', name: 'Prime Video', color: 'bg-blue-500' },
  { id: 'stan', name: 'Stan', color: 'bg-cyan-600' },
  { id: 'paramount', name: 'Paramount+', color: 'bg-blue-700' },
  { id: 'disney', name: 'Disney+', color: 'bg-blue-600' },
  { id: 'binge', name: 'Binge', color: 'bg-orange-500' }
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

function StreamingFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [trendingContent, setTrendingContent] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [showServiceFilters, setShowServiceFilters] = useState(false);
  const [showGenreFilters, setShowGenreFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('trending');

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

  useEffect(() => {
    loadTrendingContent();
    loadNewReleases();
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
            return s.name.toLowerCase().includes(service.name.toLowerCase().replace('+', ''));
          })
        )
      );
    }

    if (selectedGenres.length > 0) {
      filtered = filtered.filter(item =>
        item.genre_ids && item.genre_ids.some(gid => selectedGenres.includes(gid))
      );
    }

    return filtered;
  };

  const displayContent = searchQuery 
    ? filterContent(results)
    : activeTab === 'trending'
      ? filterContent(trendingContent)
      : filterContent(newReleases);

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
        
        (selectedServices.length > 0 || selectedGenres.length > 0) && React.createElement('button', {
          onClick: () => {
            setSelectedServices([]);
            setSelectedGenres([]);
          },
          className: 'text-sm text-gray-400 hover:text-white flex items-center gap-1'
        },
          React.createElement(X, { className: 'w-3 h-3' }),
          'Clear all filters'
        )
      ),
      
      !searchQuery && React.createElement('div', { className: 'max-w-3xl mx-auto mb-8 flex gap-4' },
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
        )
      ),
      
      loading && React.createElement('div', { className: 'text-center py-12' },
        React.createElement('div', { className: 'inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin' })
      ),
      
      !loading && displayContent.length > 0 && React.createElement(React.Fragment, null,
        searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6' }, 'Search Results'),
        !searchQuery && React.createElement('h2', { className: 'text-2xl font-bold mb-6' },
          activeTab === 'trending' ? "🔥 What's Hot This Week" : "✨ New Releases"
        ),
        React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6' },
          displayContent.map(item =>
            React.createElement('div', {
              key: item.id,
              className: 'bg-gray-800 rounded-xl overflow-hidden hover:scale-105 hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-purple-500'
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
                      React.createElement('img', {
                        key: idx,
                        src: service.logo,
                        alt: service.name,
                        title: service.name,
                        className: 'w-8 h-8 rounded object-cover'
                      })
                    ),
                    item.streaming.length > 3 && React.createElement('span', { className: 'text-xs text-gray-400 self-center' },
                      `+${item.streaming.length - 3}`
                    )
                  )
                ) : React.createElement('p', { className: 'text-xs text-gray-500 italic' }, 'No streaming info')
              )
            )
          )
        )
      ),
      
      !loading && displayContent.length === 0 && (searchQuery || selectedServices.length > 0 || selectedGenres.length > 0) && React.createElement('div', { className: 'text-center py-12 text-gray-400' },
        React.createElement('p', null, 'No results match your filters.'),
        React.createElement('button', {
          onClick: () => {
            setSelectedServices([]);
            setSelectedGenres([]);
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
