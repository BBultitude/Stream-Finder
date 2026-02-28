/**
 * Skeleton placeholder matching ContentCard dimensions.
 * Uses a CSS shimmer animation while content loads.
 */
export function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
      {/* Poster area */}
      <div className="w-full aspect-[2/3] bg-gray-700" />
      {/* Info area */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
        <div className="flex gap-1 mt-2">
          <div className="w-8 h-8 bg-gray-700 rounded" />
          <div className="w-8 h-8 bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for a recommendation card (compact variant).
 */
export function SkeletonCompactCard() {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 animate-pulse">
      <div className="w-full aspect-[2/3] bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
      </div>
    </div>
  )
}

/**
 * Skeleton for the Top 10 ranked list row.
 */
export function SkeletonTop10Row() {
  return (
    <div className="flex items-center gap-4 bg-gray-800 rounded-xl p-3 border border-gray-700 animate-pulse">
      <div className="w-12 h-10 bg-gray-700 rounded flex-shrink-0" />
      <div className="w-12 h-16 bg-gray-700 rounded flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/3" />
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <div className="w-7 h-7 bg-gray-700 rounded" />
        <div className="w-7 h-7 bg-gray-700 rounded" />
      </div>
    </div>
  )
}
