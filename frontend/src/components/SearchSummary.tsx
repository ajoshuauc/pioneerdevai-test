import type { InterpretedSearch } from '../types/restaurant';

interface SearchSummaryProps {
  interpreted: InterpretedSearch;
}

export function SearchSummary({ interpreted }: SearchSummaryProps) {
  const priceLabel = (level: number | null | undefined) => {
    if (level == null) return null;
    return '$'.repeat(level);
  };

  return (
    <div className="w-full flex flex-wrap items-center gap-2 text-xs text-gray-400">
      <span className="font-medium text-gray-500">Searched:</span>
      <span className="bg-gray-100 px-2 py-0.5 rounded-md">🔍 {interpreted.query}</span>
      <span className="bg-gray-100 px-2 py-0.5 rounded-md">📍 {interpreted.near}</span>
      {interpreted.openNow && (
        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-md">🕐 Open Now</span>
      )}
      {(interpreted.minPrice != null || interpreted.maxPrice != null) && (
        <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-md">
          💰 {priceLabel(interpreted.minPrice)}{interpreted.maxPrice != null && interpreted.minPrice != null ? '–' : ''}{priceLabel(interpreted.maxPrice)}
        </span>
      )}
      {interpreted.sort && (
        <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-md">↕️ {interpreted.sort}</span>
      )}
    </div>
  );
}
