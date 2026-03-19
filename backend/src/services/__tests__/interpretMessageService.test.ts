import { describe, it, expect, vi } from 'vitest';
import { interpretMessage } from '../interpretMessageService.js';
import { HttpError } from '../../utils/httpError.js';

// Helper: build a mock OpenAI client that returns the given content string(s).
// If multiple contents are provided, they are returned in order across calls.
function mockOpenAI(...contents: (string | null)[]) {
  const create = vi.fn();
  for (const content of contents) {
    create.mockResolvedValueOnce({
      choices: [{ message: { content } }],
    });
  }
  return { chat: { completions: { create } } } as any;
}

function validResponse(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    intent: 'restaurant_search',
    query: 'sushi',
    near: 'downtown LA',
    ...overrides,
  });
}

describe('interpretMessage', () => {
  // ── Happy path ──────────────────────────────────────────

  it('parses a valid restaurant search', async () => {
    const client = mockOpenAI(validResponse());
    const result = await interpretMessage('sushi near downtown LA', client);

    expect(result.intent).toBe('restaurant_search');
    expect(result.query).toBe('sushi');
    expect(result.near).toBe('downtown LA');
  });

  it('passes optional fields through', async () => {
    const client = mockOpenAI(
      validResponse({ openNow: true, minPrice: 1, maxPrice: 2, sort: 'RATING', limit: 5 }),
    );
    const result = await interpretMessage('cheap rated sushi in LA open now', client);

    expect(result.openNow).toBe(true);
    expect(result.minPrice).toBe(1);
    expect(result.maxPrice).toBe(2);
    expect(result.sort).toBe('RATING');
    expect(result.limit).toBe(5);
  });

  // ── Intent classification ────────────────────────────────

  it('throws 422 HttpError for gibberish input', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'gibberish', query: 'restaurant', near: 'New York' }),
    );

    await expect(interpretMessage('fdjhasoddsajod', client)).rejects.toThrow(HttpError);
    await expect(interpretMessage('fdjhasoddsajod', mockOpenAI(
      JSON.stringify({ intent: 'gibberish', query: 'restaurant', near: 'New York' }),
    ))).rejects.toThrow(/valid request/);
  });

  it('throws 422 HttpError for off-topic input', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'off_topic', query: 'restaurant', near: 'New York' }),
    );

    await expect(interpretMessage('make me a sandwich', client)).rejects.toThrow(HttpError);
    await expect(interpretMessage('make me a sandwich', mockOpenAI(
      JSON.stringify({ intent: 'off_topic', query: 'restaurant', near: 'New York' }),
    ))).rejects.toThrow(/restaurant searches/);
  });

  it('returns correct HTTP status code for gibberish', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'gibberish', query: 'restaurant', near: 'New York' }),
    );

    try {
      await interpretMessage('asdfghjkl', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(422);
    }
  });

  it('returns correct HTTP status code for off-topic', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'off_topic', query: 'restaurant', near: 'New York' }),
    );

    try {
      await interpretMessage('what is the meaning of life', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(422);
    }
  });

  // ── Retry logic ──────────────────────────────────────────

  it('retries on invalid JSON and succeeds on second attempt', async () => {
    const client = mockOpenAI('not json at all', validResponse({ query: 'pizza', near: 'NYC' }));
    const result = await interpretMessage('pizza in NYC', client);

    expect(result.query).toBe('pizza');
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('retries on schema validation failure and succeeds', async () => {
    // First response: valid JSON but missing required "intent" field
    const bad = JSON.stringify({ query: 'tacos', near: 'Austin' });
    const good = validResponse({ query: 'tacos', near: 'Austin' });
    const client = mockOpenAI(bad, good);

    const result = await interpretMessage('tacos in Austin', client);
    expect(result.query).toBe('tacos');
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('retries on empty content and succeeds', async () => {
    const client = mockOpenAI(null, validResponse());
    const result = await interpretMessage('sushi in LA', client);

    expect(result.query).toBe('sushi');
    expect(client.chat.completions.create).toHaveBeenCalledTimes(2);
  });

  it('includes error feedback in retry messages', async () => {
    const client = mockOpenAI('bad json', validResponse());
    await interpretMessage('pizza in NYC', client);

    const secondCallArgs = client.chat.completions.create.mock.calls[1]?.[0];
    const messages = secondCallArgs?.messages as Array<{ role: string; content: string }>;
    const retryMsg = messages.find(
      (m) => m.role === 'user' && m.content.includes('previous response was invalid'),
    );
    expect(retryMsg).toBeDefined();
  });

  // ── Exhausted retries ────────────────────────────────────

  it('throws 503 HttpError after exhausting all retries (3 attempts)', async () => {
    const client = mockOpenAI('bad', 'bad', 'bad');

    try {
      await interpretMessage('anything', client);
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(503);
      expect((err as HttpError).message).toMatch(/multiple attempts/);
    }

    expect(client.chat.completions.create).toHaveBeenCalledTimes(3);
  });

  // ── HttpError passthrough (no retry) ─────────────────────

  it('does not retry when gibberish HttpError is thrown', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'gibberish', query: 'restaurant', near: 'New York' }),
    );

    await expect(interpretMessage('xyzzy', client)).rejects.toThrow(HttpError);
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it('does not retry when off-topic HttpError is thrown', async () => {
    const client = mockOpenAI(
      JSON.stringify({ intent: 'off_topic', query: 'restaurant', near: 'New York' }),
    );

    await expect(interpretMessage('tell me a joke', client)).rejects.toThrow(HttpError);
    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
  });
});
