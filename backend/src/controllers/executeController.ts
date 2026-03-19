import type { Request, Response, NextFunction } from 'express';
import { executeQuerySchema } from '../schemas/executeQuerySchema.js';
import { executeSearch } from '../services/restaurantSearchService.js';
import { HttpError } from '../utils/httpError.js';

export async function executeController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Validate query params
    const parseResult = executeQuerySchema.safeParse(req.query);

    if (!parseResult.success) {
      const issues = parseResult.error.issues;
      const codeError = issues.find((e) => e.path.includes('code'));
      if (codeError) {
        throw new HttpError(401, 'Unauthorized');
      }
      throw new HttpError(400, issues[0]?.message ?? 'Invalid request');
    }

    const { message, code } = parseResult.data;

    // Explicit code check (defense in depth)
    if (code !== 'pioneerdevai') {
      throw new HttpError(401, 'Unauthorized');
    }

    // Execute the search pipeline
    const result = await executeSearch(message);

    res.json(result);
  } catch (error) {
    if (error instanceof HttpError) {
      const body: { error: string; code?: string } = { error: error.message };
      if (error.code) body.code = error.code;
      res.status(error.statusCode).json(body);
      return;
    }

    // True unexpected error — nothing we threw intentionally
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
