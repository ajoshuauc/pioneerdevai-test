import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { HttpError } from '../../utils/httpError.js';

vi.mock('../../services/restaurantSearchService.js', () => ({
  executeSearch: vi.fn(),
}));

import { executeController } from '../executeController.js';
import { executeSearch } from '../../services/restaurantSearchService.js';

function makeReq(query: Record<string, unknown>): Request {
  return { query } as unknown as Request;
}

function makeRes(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  (res.status as ReturnType<typeof vi.fn>).mockReturnValue(res);
  (res.json as ReturnType<typeof vi.fn>).mockReturnValue(res);
  return res as unknown as Response;
}

const next = vi.fn() as unknown as NextFunction;

describe('executeController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── code validation ────────────────────────────────────

  describe('code validation', () => {
    it('returns 401 when code is missing', async () => {
      const req = makeReq({ message: 'sushi in LA' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 401 when code is incorrect', async () => {
      const req = makeReq({ message: 'sushi in LA', code: 'wrongcode' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('does not call executeSearch when code is missing', async () => {
      const req = makeReq({ message: 'sushi in LA' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(executeSearch).not.toHaveBeenCalled();
    });
  });

  // ── message validation ─────────────────────────────────

  describe('message validation', () => {
    it('returns 400 when message is missing', async () => {
      const req = makeReq({ code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when message is too short', async () => {
      const req = makeReq({ message: 'hi', code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('3 characters') }),
      );
    });

    it('returns 400 when message exceeds 500 characters', async () => {
      const req = makeReq({ message: 'a'.repeat(501), code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── successful request ─────────────────────────────────

  describe('successful request', () => {
    it('calls executeSearch with the message and returns results', async () => {
      const mockResult = {
        interpreted: { intent: 'restaurant_search', locationSpecified: true, query: 'sushi', near: 'LA' },
        results: [],
        totalResults: 0,
      };
      vi.mocked(executeSearch).mockResolvedValueOnce(mockResult as any);

      const req = makeReq({ message: 'sushi in downtown LA', code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);

      expect(executeSearch).toHaveBeenCalledWith('sushi in downtown LA');
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  // ── error handling ─────────────────────────────────────

  describe('error handling', () => {
    it('returns the correct status when executeSearch throws an HttpError', async () => {
      vi.mocked(executeSearch).mockRejectedValueOnce(
        new HttpError(422, 'No location specified'),
      );

      const req = makeReq({ message: 'find best pizza', code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ error: 'No location specified' });
    });

    it('includes error code in response when HttpError has a code', async () => {
      vi.mocked(executeSearch).mockRejectedValueOnce(
        new HttpError(422, 'Unknown location', 'UNKNOWN_LOCATION'),
      );

      const req = makeReq({ message: 'sushi in downtown LA', code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unknown location', code: 'UNKNOWN_LOCATION' });
    });

    it('returns 500 for unexpected errors', async () => {
      vi.mocked(executeSearch).mockRejectedValueOnce(new Error('Unexpected failure'));

      const req = makeReq({ message: 'sushi in downtown LA', code: 'pioneerdevai' });
      const res = makeRes();
      await executeController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
