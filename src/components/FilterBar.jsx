import { useState } from 'react'
import PropTypes from 'prop-types'
import { ChevronDown, X } from './icons'

export const STREAMING_SERVICES = [
  { id: 'netflix',   name: 'Netflix',     providerIds: [8, 1796],         color: 'bg-red-600' },
  { id: 'prime',     name: 'Prime Video', providerIds: [119, 9, 2100],    color: 'bg-blue-500' },
  { id: 'stan',      name: 'Stan',        providerIds: [21],              color: 'bg-cyan-600' },
  { id: 'paramount', name: 'Paramount+',  providerIds: [531, 582, 1853],  color: 'bg-blue-700' },
  { id: 'disney',    name: 'Disney+',     providerIds: [337],             color: 'bg-blue-600' },
  { id: 'binge',     name: 'Binge',       providerIds: [385, 134],        color: 'bg-orange-500' },
  { id: 'max',       name: 'Max',         providerIds: [1899],            color: 'bg-purple-700' },
]

export const GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 16,    name: 'Animation' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 27,    name: 'Horror' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Sci-Fi' },
  { id: 53,    name: 'Thriller' },
]

export const DECADES = [
  { id: 1970, label: '1970s' },
  { id: 1980, label: '1980s' },
  { id: 1990, label: '1990s' },
  { id: 2000, label: '2000s' },
  { id: 2010, label: '2010s' },
  { id: 2020, label: '2020s' },
]

export const RATING_OPTIONS = [
  { id: 0, label: 'Any' },
  { id: 6, label: '★ 6+' },
  { id: 7, label: '★ 7+' },
  { id: 8, label: '★ 8+' },
]

const CONTENT_TYPES = [
  { id: 'all',   name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv',    name: 'TV Shows' },
]

const SORT_OPTIONS = [
  { id: 'popularity',   label: 'Most Popular' },
  { id: 'vote_average', label: 'Highest Rated' },
  { id: 'release_date', label: 'Newest First' },
]

export const AGE_RATINGS = ['G', 'PG', 'M', 'MA15+', 'R18+']

export const LANGUAGE_LABELS = {
  en: 'English',
  ko: 'Korean',
  ja: 'Japanese',
  hi: 'Hindi',
  fr: 'French',
  es: 'Spanish',
  zh: 'Chinese',
  th: 'Thai',
  tr: 'Turkish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ar: 'Arabic',
  ru: 'Russian',
  nl: 'Dutch',
  sv: 'Swedish',
  da: 'Danish',
  no: 'Norwegian',
  fi: 'Finnish',
  pl: 'Polish',
  id: 'Indonesian',
  tl: 'Filipino',
  ms: 'Malay',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  bn: 'Bengali',
}

export default function FilterBar({
  selectedServices, onServiceToggle,
  selectedGenres, onGenreToggle,
  selectedContentType, onContentTypeChange,
  selectedDecade, onDecadeChange,
  selectedMinRating, onMinRatingChange,
  selectedMaxCertification, onMaxCertificationChange,
  selectedLanguageFilter, onLanguageFilterChange,
  availableLanguages,
  onClearAll,
  onSurpriseMe,
  activeTab,
  sortBy,
  onSortChange
}) {
  const [showServiceFilters, setShowServiceFilters] = useState(false)
  const [showGenreFilters, setShowGenreFilters]     = useState(false)

  const hasFilters = selectedServices.length > 0 || selectedGenres.length > 0 ||
    selectedContentType !== 'all' || selectedDecade !== null || selectedMinRating > 0 ||
    selectedMaxCertification !== null || selectedLanguageFilter !== null

  return (
    <div className="max-w-3xl mx-auto mb-8 space-y-4">
      {/* Service filter */}
      <div>
        <button
          onClick={() => setShowServiceFilters(!showServiceFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white"
        >
          <span>Filter by Streaming Service</span>
          {selectedServices.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 rounded text-xs text-white">{selectedServices.length}</span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showServiceFilters ? 'rotate-180' : ''}`} />
        </button>
        {showServiceFilters && (
          <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex flex-wrap gap-2">
              {STREAMING_SERVICES.map(service => (
                <button
                  key={service.id}
                  onClick={() => onServiceToggle(service.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedServices.includes(service.id)
                      ? `${service.color} text-white shadow-lg scale-105`
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Genre filter */}
      <div>
        <button
          onClick={() => setShowGenreFilters(!showGenreFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white"
        >
          <span>Filter by Genre</span>
          {selectedGenres.length > 0 && (
            <span className="px-2 py-0.5 bg-purple-600 rounded text-xs text-white">{selectedGenres.length}</span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showGenreFilters ? 'rotate-180' : ''}`} />
        </button>
        {showGenreFilters && (
          <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => onGenreToggle(genre.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedGenres.includes(genre.id)
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content type */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300">Content Type:</span>
        {CONTENT_TYPES.map(type => (
          <button
            key={type.id}
            onClick={() => onContentTypeChange(type.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedContentType === type.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      {/* Decade filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300">Decade:</span>
        {DECADES.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onDecadeChange(selectedDecade === id ? null : id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedDecade === id
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Min score */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300">Min Score:</span>
        {RATING_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onMinRatingChange(id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedMinRating === id
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Age rating */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300">Age Rating (max):</span>
        {AGE_RATINGS.map(cert => (
          <button
            key={cert}
            onClick={() => onMaxCertificationChange(selectedMaxCertification === cert ? null : cert)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedMaxCertification === cert
                ? 'bg-rose-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {cert}
          </button>
        ))}
      </div>

      {/* Language / region filter */}
      {availableLanguages && availableLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-300">Language:</span>
          <button
            onClick={() => onLanguageFilterChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedLanguageFilter === null
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {availableLanguages.map(lang => (
            <button
              key={lang.code}
              onClick={() => onLanguageFilterChange(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedLanguageFilter === lang.code
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {LANGUAGE_LABELS[lang.code] || lang.code.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {/* Sort — Browse tab only */}
      {activeTab === 'browse' && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-300">Sort:</span>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => onSortChange(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                sortBy === opt.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Clear all + Surprise Me */}
      <div className="flex items-center gap-4">
        {hasFilters && (
          <button
            onClick={onClearAll}
            className="text-sm text-gray-300 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all filters
          </button>
        )}
        <button
          onClick={onSurpriseMe}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium text-white transition-colors"
        >
          🎲 Surprise Me
        </button>
      </div>
    </div>
  )
}

export const filterPropTypes = {
  selectedServices: PropTypes.arrayOf(PropTypes.string).isRequired,
  onServiceToggle: PropTypes.func.isRequired,
  selectedGenres: PropTypes.arrayOf(PropTypes.number).isRequired,
  onGenreToggle: PropTypes.func.isRequired,
  selectedContentType: PropTypes.string.isRequired,
  onContentTypeChange: PropTypes.func.isRequired,
  selectedDecade: PropTypes.number,
  onDecadeChange: PropTypes.func.isRequired,
  selectedMinRating: PropTypes.number.isRequired,
  onMinRatingChange: PropTypes.func.isRequired,
  selectedMaxCertification: PropTypes.string,
  onMaxCertificationChange: PropTypes.func.isRequired,
  selectedLanguageFilter: PropTypes.string,
  onLanguageFilterChange: PropTypes.func.isRequired,
  availableLanguages: PropTypes.arrayOf(PropTypes.shape({ code: PropTypes.string, count: PropTypes.number })),
  onClearAll: PropTypes.func.isRequired,
  onSurpriseMe: PropTypes.func.isRequired,
}

FilterBar.propTypes = {
  ...filterPropTypes,
  activeTab: PropTypes.string,
  sortBy: PropTypes.string,
  onSortChange: PropTypes.func,
}
