import { env } from '../config/env.js';
import type { InterpretedSearch } from '../types/search.js';

const FOURSQUARE_BASE_URL = 'https://places-api.foursquare.com/places/search';
const FOURSQUARE_API_VERSION = '2025-06-17';

interface FoursquareCategory {
  name: string;
  short_name?: string;
}

interface FoursquareLocation {
  formatted_address?: string;
}

interface FoursquareHours {
  open_now?: boolean;
  display?: string;
}

export interface FoursquarePlace {
  fsq_id?: string;
  fsq_place_id?: string;
  name: string;
  location?: FoursquareLocation;
  categories?: FoursquareCategory[];
  distance?: number;
  rating?: number;
  price?: number;
  hours?: FoursquareHours;
  latitude?: number;
  longitude?: number;
  geocodes?: {
    main?: {
      latitude: number;
      longitude: number;
    };
  };
}

interface FoursquareSearchResponse {
  results: FoursquarePlace[];
}

export async function searchFoursquare(params: InterpretedSearch): Promise<FoursquarePlace[]> {
  const apiKey = env.FOURSQUARE_API_KEY;

  const searchParams = new URLSearchParams();

  searchParams.set('query', params.query);
  searchParams.set('near', params.near);

  if (params.openNow) {
    searchParams.set('open_now', 'true');
  }
  if (params.minPrice !== undefined) {
    searchParams.set('min_price', String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    searchParams.set('max_price', String(params.maxPrice));
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  searchParams.set('limit', String(params.limit ?? 10));

  const url = `${FOURSQUARE_BASE_URL}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'X-Places-Api-Version': FOURSQUARE_API_VERSION,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Foursquare API error (${response.status}): ${errorBody}`);
  }

  const data = (await response.json()) as FoursquareSearchResponse;
  return data.results ?? [];
}
