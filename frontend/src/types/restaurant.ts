export interface InterpretedSearch {
  query: string;
  near: string;
  openNow: boolean | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: string | null;
  limit: number | null;
}

export interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  categories: string[];
  distance?: number;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface SearchResponse {
  interpreted: InterpretedSearch;
  results: RestaurantResult[];
  totalResults: number;
}
