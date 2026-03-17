import { useState } from 'react';
import { executeSearch } from '../api/searchApi';
import type { SearchResponse } from '../types/restaurant';

const MIN_MESSAGE_LENGTH = 3;
const MAX_MESSAGE_LENGTH = 500;

interface UseRestaurantSearchReturn {
  data: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  search: (message: string) => Promise<void>;
  reset: () => void;
}

export function useRestaurantSearch(): UseRestaurantSearchReturn {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (message: string) => {
    const trimmedMessage = message.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError('Please enter at least 3 characters.');
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError('Please keep your search under 500 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await executeSearch(trimmedMessage);
      setData(result);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error ?? 'Something went wrong');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
  };

  return { data, isLoading, error, search, reset };
}
