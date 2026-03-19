import { describe, it, expect } from 'vitest';
import { interpretedSearchSchema } from '../interpretedSearchSchema.js';

describe('interpretedSearchSchema', () => {
  it('accepts a valid restaurant_search input with all fields', () => {
    const input = {
      intent: 'restaurant_search',
      query: 'sushi',
      near: 'downtown LA',
      openNow: true,
      minPrice: 1,
      maxPrice: 3,
      sort: 'RATING',
      limit: 10,
    };

    const result = interpretedSearchSchema.safeParse(input);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject(input);
  });

  it('accepts minimal valid input with defaults', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
    });

    expect(result.success).toBe(true);
    expect(result.data?.query).toBe('restaurant');
    expect(result.data?.near).toBe('New York');
  });

  it('accepts gibberish intent', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'gibberish',
      query: 'restaurant',
      near: 'New York',
    });

    expect(result.success).toBe(true);
    expect(result.data?.intent).toBe('gibberish');
  });

  it('accepts off_topic intent', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'off_topic',
      query: 'restaurant',
      near: 'New York',
    });

    expect(result.success).toBe(true);
    expect(result.data?.intent).toBe('off_topic');
  });

  it('rejects missing intent field', () => {
    const result = interpretedSearchSchema.safeParse({
      query: 'tacos',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid intent value', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'unknown',
      query: 'tacos',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });

  it('rejects minPrice out of range', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: 'tacos',
      near: 'Austin',
      minPrice: 5,
    });

    expect(result.success).toBe(false);
  });

  it('rejects maxPrice out of range', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: 'tacos',
      near: 'Austin',
      maxPrice: 0,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid sort value', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: 'tacos',
      near: 'Austin',
      sort: 'ALPHABETICAL',
    });

    expect(result.success).toBe(false);
  });

  it('rejects limit above 50', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: 'tacos',
      near: 'Austin',
      limit: 100,
    });

    expect(result.success).toBe(false);
  });

  it('rejects empty query string', () => {
    const result = interpretedSearchSchema.safeParse({
      intent: 'restaurant_search',
      query: '',
      near: 'Austin',
    });

    expect(result.success).toBe(false);
  });
});
