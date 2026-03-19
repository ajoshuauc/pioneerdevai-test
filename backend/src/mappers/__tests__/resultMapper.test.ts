import { describe, it, expect } from 'vitest';
import { mapFoursquareResults } from '../resultMapper.js';
import type { FoursquarePlace } from '../../services/foursquareService.js';
import type { InterpretedSearch } from '../../types/search.js';

const baseParams: InterpretedSearch = {
  intent: 'restaurant_search',
  locationSpecified: true,
  query: 'sushi',
  near: 'downtown LA',
};

type LoosePlaceOverrides = { [K in keyof FoursquarePlace]?: FoursquarePlace[K] | undefined };

function makePlace(overrides: LoosePlaceOverrides = {}): FoursquarePlace {
  return {
    fsq_place_id: 'abc123',
    name: 'Test Restaurant',
    location: { formatted_address: '123 Main St, Los Angeles, CA 90001' },
    categories: [{ name: 'Japanese Restaurant', short_name: 'Japanese' }],
    distance: 500,
    geocodes: { main: { latitude: 34.0195, longitude: -118.4912 } },
    ...overrides,
  } as FoursquarePlace;
}

describe('mapFoursquareResults', () => {
  it('returns an empty array when given no places', () => {
    expect(mapFoursquareResults([], baseParams)).toEqual([]);
  });

  it('maps basic place fields correctly', () => {
    const [result] = mapFoursquareResults([makePlace()], baseParams);
    expect(result?.name).toBe('Test Restaurant');
    expect(result?.address).toBe('123 Main St, Los Angeles, CA 90001');
    expect(result?.categories).toEqual(['Japanese']);
    expect(result?.distance).toBe(500);
  });

  it('falls back to "Address not available" when location is missing', () => {
    const [result] = mapFoursquareResults([makePlace({ location: undefined })], baseParams);
    expect(result?.address).toBe('Address not available');
  });

  it('returns empty categories array when categories field is missing', () => {
    const [result] = mapFoursquareResults([makePlace({ categories: undefined })], baseParams);
    expect(result?.categories).toEqual([]);
  });

  it('uses category name when short_name is absent', () => {
    const [result] = mapFoursquareResults(
      [makePlace({ categories: [{ name: 'Sushi Restaurant' }] })],
      baseParams,
    );
    expect(result?.categories).toEqual(['Sushi Restaurant']);
  });

  it('maps multiple places', () => {
    const places = [
      makePlace({ name: 'Restaurant A', fsq_place_id: 'aaa' }),
      makePlace({ name: 'Restaurant B', fsq_place_id: 'bbb' }),
    ];
    const results = mapFoursquareResults(places, baseParams);
    expect(results).toHaveLength(2);
    expect(results[0]?.name).toBe('Restaurant A');
    expect(results[1]?.name).toBe('Restaurant B');
  });

  // ── id resolution ──────────────────────────────────────

  describe('id resolution', () => {
    it('uses fsq_place_id when present', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ fsq_place_id: 'place_1', fsq_id: 'fsq_1' })],
        baseParams,
      );
      expect(result?.id).toBe('place_1');
    });

    it('falls back to fsq_id when fsq_place_id is absent', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ fsq_place_id: undefined, fsq_id: 'fsq_1' })],
        baseParams,
      );
      expect(result?.id).toBe('fsq_1');
    });

    it('falls back to name when both fsq ids are absent', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ fsq_place_id: undefined, fsq_id: undefined, name: 'Fallback Name' })],
        baseParams,
      );
      expect(result?.id).toBe('Fallback Name');
    });
  });

  // ── coordinates ────────────────────────────────────────

  describe('coordinates', () => {
    it('reads coordinates from geocodes.main', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ geocodes: { main: { latitude: 34.0195, longitude: -118.4912 } } })],
        baseParams,
      );
      expect(result?.location).toEqual({ lat: 34.0195, lng: -118.4912 });
    });

    it('falls back to top-level lat/lng when geocodes are absent', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ geocodes: undefined, latitude: 40.7128, longitude: -74.006 })],
        baseParams,
      );
      expect(result?.location).toEqual({ lat: 40.7128, lng: -74.006 });
    });

    it('returns undefined location when no coordinates are available', () => {
      const [result] = mapFoursquareResults(
        [makePlace({ geocodes: undefined, latitude: undefined, longitude: undefined })],
        baseParams,
      );
      expect(result?.location).toBeUndefined();
    });
  });
});
