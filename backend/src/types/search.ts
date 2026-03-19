import type { InterpretedSearch } from '../schemas/interpretedSearchSchema.js';

export type { InterpretedSearch };

export interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  categories: string[];
  distance?: number | undefined;
  location?: {
    lat: number;
    lng: number;
  } | undefined;
}

export interface ExecuteResponse {
  interpreted: InterpretedSearch;
  results: RestaurantResult[];
  totalResults: number;
}
