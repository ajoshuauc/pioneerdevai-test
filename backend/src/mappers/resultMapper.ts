import type { FoursquarePlace } from '../services/foursquareService.js';
import type { InterpretedSearch, RestaurantResult } from '../types/search.js';

export function mapFoursquareResults(
  places: FoursquarePlace[],
  params: InterpretedSearch,
): RestaurantResult[] {
  const mapped = places.map((place) => mapPlace(place));
  return rankResults(mapped, params);
}

function mapPlace(place: FoursquarePlace): RestaurantResult {
  const coordinates = getCoordinates(place);

  return {
    id: place.fsq_place_id ?? place.fsq_id ?? place.name,
    name: place.name,
    address: place.location?.formatted_address ?? 'Address not available',
    categories: place.categories?.map((c) => c.short_name ?? c.name) ?? [],
    distance: place.distance,
    rating: place.rating,
    price: place.price,
    hours: place.hours
      ? {
          openNow: place.hours.open_now,
          display: place.hours.display,
        }
      : undefined,
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

function rankResults(
  results: RestaurantResult[],
  params: InterpretedSearch,
): RestaurantResult[] {
  return results.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Boost results that match price preference
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      if (a.price !== undefined) {
        const inRange =
          (params.minPrice === undefined || a.price >= params.minPrice) &&
          (params.maxPrice === undefined || a.price <= params.maxPrice);
        if (inRange) scoreA += 2;
      }
      if (b.price !== undefined) {
        const inRange =
          (params.minPrice === undefined || b.price >= params.minPrice) &&
          (params.maxPrice === undefined || b.price <= params.maxPrice);
        if (inRange) scoreB += 2;
      }
    }

    // Boost results that are open when user asked for open_now
    if (params.openNow) {
      if (a.hours?.openNow) scoreA += 3;
      if (b.hours?.openNow) scoreB += 3;
    }

    // Boost higher rated results
    if (a.rating !== undefined) scoreA += a.rating / 10;
    if (b.rating !== undefined) scoreB += b.rating / 10;

    return scoreB - scoreA;
  });
}
