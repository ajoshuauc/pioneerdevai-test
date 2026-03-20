import { describe, it, expect } from 'vitest';
import { interpretedSearchSchema } from '../interpretedSearchSchema.js';

describe('interpretedSearchSchema', () => {
  it('accepts a valid restaurant_search input with all fields', () => {
    const input = {
      intent: 'restaurant_search',
      locationSpecified: true,
      query: 'sushi',
      near: 'downtown LA',
      openNow: true,
      minPrice: 1,
      maxPrice: 3,
      sort: 'DISTANCE',
      limit: 10,
    };

    const result = interpretedSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(input);
  });

  it('accepts minimal valid input with nullable fields', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: false,
      query: 'restaurant',
      near: 'New York',
      openNow: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      limit: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.query).toBe('restaurant');
    expect(result.data?.near).toBe('New York');
  });

  it('rejects missing near field', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: false,
    });

    expect(result.success).toBe(false);
  });

  it('accepts gibberish intent', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'gibberish',
      locationSpecified: false,
      query: 'restaurant',
      near: 'New York',
      openNow: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      limit: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.intent).toBe('gibberish');
  });

  it('accepts off_topic intent', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'off_topic',
      locationSpecified: false,
      query: 'restaurant',
      near: 'New York',
      openNow: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      limit: null,
    });

    expect(result.success).toBe(true);
    expect(result.data?.intent).toBe('off_topic');
  });

  it('rejects missing locationSpecified field', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: 'tacos',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing intent field', () => {
    const result = interpretedSearchSchema.safeParse({
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid intent value', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'unknown',
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });

  it('rejects minPrice out of range', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
      minPrice: 5,
    });

    expect(result.success).toBe(false);
  });

  it('rejects maxPrice out of range', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
      maxPrice: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
      sort: 'ALPHABETICAL',
    });

    expect(result.success).toBe(false);
  });

  it('rejects limit above 50', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: true,
      query: 'tacos',
      near: 'Austin',
      limit: 100,
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty query string', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      locationSpecified: true,
      query: '',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });
});
