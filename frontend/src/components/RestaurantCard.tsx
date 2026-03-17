import type { RestaurantResult } from '../types/restaurant';

interface RestaurantCardProps {
  restaurant: RestaurantResult;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const priceLabel = (level?: number) => {
    if (!level) return null;
    return '$'.repeat(level);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {restaurant.name}
        </h3>
        {restaurant.rating !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-green-100 text-green-800 shrink-0 ml-2">
            ⭐ {restaurant.rating.toFixed(1)}
          </span>
        )}
      </div>

      {restaurant.categories.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {restaurant.categories.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-600 mb-3">{restaurant.address}</p>

      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
        {restaurant.price !== undefined && (
          <span className="font-medium text-gray-700">
            {priceLabel(restaurant.price)}
          </span>
        )}
        {restaurant.distance !== undefined && (
          <span>
            📍 {restaurant.distance >= 1000
              ? `${(restaurant.distance / 1000).toFixed(1)} km`
              : `${restaurant.distance} m`}
          </span>
        )}
        {restaurant.hours?.openNow !== undefined && (
          <span className={restaurant.hours.openNow ? 'text-green-600 font-medium' : 'text-red-500'}>
            {restaurant.hours.openNow ? '● Open' : '● Closed'}
          </span>
        )}
        {restaurant.hours?.display && (
          <span className="text-xs text-gray-400">{restaurant.hours.display}</span>
        )}
      </div>
    </div>
  );
}
