import { useState } from 'react'
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
  { id: 6, label: '6+' },
  { id: 7, label: '7+' },
  { id: 8, label: '8+' },
]

const CONTENT_TYPES = [
  { id: 'all',   name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv',    name: 'TV Shows' },
]

export default function FilterBar({
  selectedServices, onServiceToggle,
  selectedGenres, onGenreToggle,
  selectedContentType, onContentTypeChange,
  selectedDecade, onDecadeChange,
  selectedMinRating, onMinRatingChange,
  subscriptionOnly, onSubscriptionOnlyToggle,
  onClearAll
}) {
  const [showServiceFilters, setShowServiceFilters] = useState(false)
  const [showGenreFilters, setShowGenreFilters]     = useState(false)

  const hasFilters = selectedServices.length > 0 || selectedGenres.length > 0 ||
    selectedContentType !== 'all' || selectedDecade !== null ||
    selectedMinRating > 0 || subscriptionOnly

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

      {/* Min rating */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-gray-300">Min Rating:</span>
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

      {/* Subscription only toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSubscriptionOnlyToggle}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            subscriptionOnly ? 'bg-green-600' : 'bg-gray-600'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            subscriptionOnly ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
        <span className="text-sm text-gray-300">Subscription streaming only</span>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-300 hover:text-white flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}
    </div>
  )
}
