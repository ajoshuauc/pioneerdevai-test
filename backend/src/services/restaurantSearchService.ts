import { interpretMessage } from './interpretMessageService.js';
import { searchFoursquare } from './foursquareService.js';
import { mapFoursquareResults } from '../mappers/resultMapper.js';
import type { ExecuteResponse } from '../types/search.js';

export async function executeSearch(message: string): Promise<ExecuteResponse> {
  // Step 1: Interpret natural language into structured params
  const interpreted = await interpretMessage(message);

  // Step 2: Query Foursquare with validated params
  const places = await searchFoursquare(interpreted);

  // Step 3: Map and rank results
  const results = mapFoursquareResults(places, interpreted);

  return {
    interpreted,
    results,
    totalResults: results.length,
  };
}
