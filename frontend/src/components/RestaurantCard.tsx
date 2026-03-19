import type { RestaurantResult } from '../types/restaurant';

interface RestaurantCardProps {
  restaurant: RestaurantResult;
}

function formatDistance(meters?: number): string | null {
  if (meters === undefined) return null;
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const distance = formatDistance(restaurant.distance);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 leading-tight truncate">
          {restaurant.name}
        </h3>
        {restaurant.categories.length > 0 && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {restaurant.categories.join(' · ')}
          </p>
        )}

        {distance && (
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <span className="text-gray-400">◎</span> {distance}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 truncate">
          <span className="text-gray-400 shrink-0">◉</span>
          {restaurant.address}
        </p>
      </div>
    </div>
  );
}
