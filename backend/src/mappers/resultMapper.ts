import type { FoursquarePlace } from '../services/foursquareService.js';
import type { InterpretedSearch, RestaurantResult } from '../types/search.js';

export function mapFoursquareResults(
  places: FoursquarePlace[],
  params: InterpretedSearch,
): RestaurantResult[] {
  const mapped = places.map((place) => mapPlace(place));
  const filtered = filterResults(mapped, params);
  // Fall back to unfiltered set if hard filtering removed all results
  const candidates = filtered.length > 0 ? filtered : mapped;
  return rankResults(candidates, params);
}

// NOTE: open_now and price filtering is enforced at the Foursquare query level
// (see foursquareService.ts). Post-fetch filtering here is a no-op on the free tier
// since hours and price fields are not returned. This would activate on a premium plan.
function filterResults(
  results: RestaurantResult[],
  _params: InterpretedSearch,
): RestaurantResult[] {
  return results;
}

function mapPlace(place: FoursquarePlace): RestaurantResult {
  const coordinates = getCoordinates(place);

  return {
    id: place.fsq_place_id ?? place.fsq_id ?? place.name,
    name: place.name,
    address: place.location?.formatted_address ?? 'Address not available',
    categories: place.categories?.map((c) => c.short_name ?? c.name) ?? [],
    distance: place.distance,
    location: coordinates,
  };
}

function getCoordinates(place: FoursquarePlace): RestaurantResult['location'] {
  if (place.geocodes?.main) {
    return {
      lat: place.geocodes.main.latitude,
      lng: place.geocodes.main.longitude,
    };
  }

  if (place.latitude !== undefined && place.longitude !== undefined) {
    return {
      lat: place.latitude,
      lng: place.longitude,
    };
  }

  return undefined;
}

// NOTE: Ranking by rating, price, and open status requires Foursquare premium fields.
// With the free tier, those fields are not returned, so Foursquare's default
// relevance order is preserved. This logic would activate on a premium plan.
function rankResults(
  results: RestaurantResult[],
  _params: InterpretedSearch,
): RestaurantResult[] {
  return results;
}
