import { describe, it, expect, vi } from 'vitest';
import OpenAI from 'openai';
import { interpretMessage } from '../interpretMessageService.js';
import { HttpError } from '../../utils/httpError.js';

// Helper: build a mock OpenAI client whose chat.completions.parse returns
// a structured-output style response with `message.parsed`.
function mockOpenAI(...responses: Array<Record<string, unknown> | null | Error>) {
  const parse = vi.fn();

  for (const response of responses) {
    if (response instanceof Error) {
      parse.mockRejectedValueOnce(response);
      continue;
    }

    parse.mockResolvedValueOnce({
      choices: [{ message: { parsed: response } }],
    });
  }

  return { chat: { completions: { parse } } } as any;
}

function makeRateLimitError(message = 'rate limited') {
  return new OpenAI.RateLimitError(429, undefined, message, new Headers());
}

function makeInternalServerError(message = 'server exploded') {
  return new OpenAI.InternalServerError(500, undefined, message, new Headers());
}

function makeConnectionError(message = 'network error') {
  return new OpenAI.APIConnectionError({ message });
}

function makeBadRequestError(message = 'bad request shape') {
  return new OpenAI.BadRequestError(400, undefined, message, new Headers());
}

function validParsed(overrides: Record<string, unknown> = {}) {
  return {
    intent: 'restaurant_search',
    locationSpecified: true,
    query: 'sushi',
    near: 'downtown LA',
    openNow: null,
    minPrice: null,
    maxPrice: null,
    sort: null,
    limit: null,
    ...overrides,
  };
}

describe('interpretMessage', () => {
  // ── Happy path ──────────────────────────────────────────

  it('parses a valid restaurant search', async () => {
    const client = mockOpenAI(validParsed());
    const result = await interpretMessage('sushi near downtown LA', client);

    expect(result.intent).toBe('restaurant_search');
    expect(result.query).toBe('sushi');
    expect(result.near).toBe('downtown LA');
  });

  it('passes optional fields through', async () => {
    const client = mockOpenAI(
      validParsed({ openNow: true, minPrice: 1, maxPrice: 2, sort: 'DISTANCE', limit: 5 }),
    );
    const result = await interpretMessage('cheap rated sushi in LA open now', client);

    expect(result.openNow).toBe(true);
    expect(result.minPrice).toBe(1);
    expect(result.maxPrice).toBe(2);
    expect(result.sort).toBe('DISTANCE');
    expect(result.limit).toBe(5);
  });

  it('calls chat.completions.parse exactly once', async () => {
    const client = mockOpenAI(validParsed());
    await interpretMessage('sushi near downtown LA', client);

    expect(client.chat.completions.parse).toHaveBeenCalledTimes(1);
  });

  // ── Intent classification ────────────────────────────────

  it('throws 422 HttpError for gibberish input', async () => {
    const client = mockOpenAI({ intent: 'gibberish', locationSpecified: false, query: 'restaurant', near: 'New York' });

    await expect(interpretMessage('fdjhasoddsajod', client)).rejects.toThrow(HttpError);
    await expect(interpretMessage('fdjhasoddsajod', mockOpenAI(
      { intent: 'gibberish', locationSpecified: false, query: 'restaurant', near: 'New York' },
    ))).rejects.toThrow(/valid request/);
  });

  it('throws 422 HttpError for off-topic input', async () => {
    const client = mockOpenAI({ intent: 'off_topic', locationSpecified: false, query: 'restaurant', near: 'New York' });

    await expect(interpretMessage('make me a sandwich', client)).rejects.toThrow(HttpError);
    await expect(interpretMessage('make me a sandwich', mockOpenAI(
      { intent: 'off_topic', locationSpecified: false, query: 'restaurant', near: 'New York' },
    ))).rejects.toThrow(/restaurant searches/);
  });

  it('returns correct HTTP status code for gibberish', async () => {
    const client = mockOpenAI({ intent: 'gibberish', locationSpecified: false, query: 'restaurant', near: 'New York' });

    try {
      await interpretMessage('asdfghjkl', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(422);
    }
  });

  it('returns correct HTTP status code for off-topic', async () => {
    const client = mockOpenAI({ intent: 'off_topic', locationSpecified: false, query: 'restaurant', near: 'New York' });

    try {
      await interpretMessage('what is the meaning of life', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(422);
    }
  });

  it('throws 422 HttpError when no location is specified', async () => {
    const client = mockOpenAI({ intent: 'restaurant_search', locationSpecified: false, query: 'sushi', near: 'New York' });

    try {
      await interpretMessage('best sushi open now', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(422);
      expect((err as HttpError).message).toMatch(/location/);
    }
  });

  // ── API / network errors ─────────────────────────────────

  it('retries transient OpenAI errors and succeeds on a later attempt', async () => {
    const client = mockOpenAI(
      makeRateLimitError(),
      validParsed({ query: 'ramen', near: 'Seattle' }),
    );

    const result = await interpretMessage('ramen in Seattle', client);

    expect(result.query).toBe('ramen');
    expect(client.chat.completions.parse).toHaveBeenCalledTimes(2);
  });

  it('retries transient OpenAI errors up to the max and then throws 503', async () => {
    const client = mockOpenAI(
      makeInternalServerError(),
      makeInternalServerError(),
      makeInternalServerError(),
    );

    await expect(interpretMessage('sushi in LA', client)).rejects.toThrow(HttpError);
    expect(client.chat.completions.parse).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-transient errors from the OpenAI call', async () => {
    const client = mockOpenAI(makeBadRequestError());

    await expect(interpretMessage('sushi in LA', client)).rejects.toThrow(HttpError);
    expect(client.chat.completions.parse).toHaveBeenCalledTimes(1);
  });

  it('throws 503 HttpError when the API call fails with a transient error', async () => {
    const client = mockOpenAI(
      makeConnectionError(),
      makeConnectionError(),
      makeConnectionError(),
    );

    try {
      await interpretMessage('sushi in LA', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(503);
    }
  });

  it('throws 503 HttpError when parsed result is null', async () => {
    const client = mockOpenAI(null);

    try {
      await interpretMessage('sushi in LA', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(503);
    }
  });
});
