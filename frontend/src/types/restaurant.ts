export interface InterpretedSearch {
  query: string;
  near: string;
  openNow?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  limit?: number;
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
