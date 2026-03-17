import type { InterpretedSearch } from '../types/restaurant';

interface SearchSummaryProps {
  interpreted: InterpretedSearch;
}

export function SearchSummary({ interpreted }: SearchSummaryProps) {
  const priceLabel = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-blue-800 mb-2">Interpreted Search</h3>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          🔍 {interpreted.query}
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          📍 {interpreted.near}
        </span>
        {interpreted.openNow && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            🕐 Open Now
          </span>
        )}
        {(interpreted.minPrice || interpreted.maxPrice) && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            💰 {priceLabel(interpreted.minPrice)}{interpreted.maxPrice && interpreted.minPrice ? ' - ' : ''}{priceLabel(interpreted.maxPrice)}
          </span>
        )}
        {interpreted.sort && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            ↕️ {interpreted.sort}
          </span>
        )}
      </div>
    </div>
  );
}
