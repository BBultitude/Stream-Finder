import PropTypes from 'prop-types'
import { X } from './icons'
import { STREAMING_SERVICES, GENRES, DECADES, RATING_OPTIONS, AGE_RATINGS, LANGUAGE_LABELS, filterPropTypes } from './FilterBar'

const CONTENT_TYPES = [
  { id: 'all',   name: 'All' },
  { id: 'movie', name: 'Movies' },
  { id: 'tv',    name: 'TV Shows' },
]

export default function FilterSheet({
  open,
  onClose,
  selectedServices, onServiceToggle,
  selectedGenres, onGenreToggle,
  selectedContentType, onContentTypeChange,
  selectedDecade, onDecadeChange,
  selectedMinRating, onMinRatingChange,
  selectedMaxCertification, onMaxCertificationChange,
  selectedLanguageFilter, onLanguageFilterChange,
  availableLanguages,
  onClearAll,
  onSurpriseMe
}) {
  if (!open) return null

  const hasFilters = selectedServices.length > 0 || selectedGenres.length > 0 ||
    selectedContentType !== 'all' || selectedDecade !== null || selectedMinRating > 0 ||
    selectedMaxCertification !== null || selectedLanguageFilter !== null

  return (
    <>
      {/* Backdrop */}
      <button
        type="button"
        className="md:hidden fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-label="Close filters"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      />

      {/* Sheet */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl border-t border-gray-700 max-h-[85vh] overflow-y-auto pb-safe">
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-800">
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Content type */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Content Type</p>
            <div className="flex flex-wrap gap-1.5">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => onContentTypeChange(type.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedContentType === type.id
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Streaming services */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Streaming Service
              {selectedServices.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-purple-600 rounded text-[10px] text-white">{selectedServices.length}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {STREAMING_SERVICES.map(service => (
                <button
                  key={service.id}
                  onClick={() => onServiceToggle(service.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          {/* Genres */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              Genre
              {selectedGenres.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-purple-600 rounded text-[10px] text-white">{selectedGenres.length}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {GENRES.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => onGenreToggle(genre.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

          {/* Decade */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Decade</p>
            <div className="flex flex-wrap gap-1.5">
              {DECADES.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onDecadeChange(selectedDecade === id ? null : id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedDecade === id
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Min score */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Min Score</p>
            <div className="flex flex-wrap gap-1.5">
              {RATING_OPTIONS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => onMinRatingChange(id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMinRating === id
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Age Rating */}
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Age Rating (max)</p>
            <div className="flex flex-wrap gap-1.5">
              {AGE_RATINGS.map(cert => (
                <button
                  key={cert}
                  onClick={() => onMaxCertificationChange(selectedMaxCertification === cert ? null : cert)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedMaxCertification === cert
                      ? 'bg-rose-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  {cert}
                </button>
              ))}
            </div>
          </div>

          {/* Language / region filter */}
          {availableLanguages && availableLanguages.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">Language</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => onLanguageFilterChange(null)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedLanguageFilter === null
                      ? 'bg-purple-600 text-white shadow-lg scale-105'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {availableLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => onLanguageFilterChange(lang.code)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedLanguageFilter === lang.code
                        ? 'bg-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                    }`}
                  >
                    {LANGUAGE_LABELS[lang.code] || lang.code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Surprise Me */}
          <button
            onClick={() => { onSurpriseMe(); onClose() }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm font-medium transition-colors"
          >
            🎲 Surprise Me
          </button>

          {/* Clear + Apply */}
          <div className="flex gap-3 pt-1">
            {hasFilters && (
              <button
                onClick={() => { onClearAll(); onClose() }}
                className="flex-1 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

FilterSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ...filterPropTypes,
}
