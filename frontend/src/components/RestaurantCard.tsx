import type { RestaurantResult } from '../types/restaurant';

interface RestaurantCardProps {
  restaurant: RestaurantResult;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-2">
        {restaurant.name}
      </h3>

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
        {restaurant.distance !== undefined && (
          <span>
            📍 {restaurant.distance >= 1000
              ? `${(restaurant.distance / 1000).toFixed(1)} km`
              : `${restaurant.distance} m`}
          </span>
        )}
      </div>
    </div>
  );
}
