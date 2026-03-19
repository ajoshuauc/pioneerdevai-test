import { useState } from 'react';
import { executeSearch } from '../api/searchApi';
import type { SearchResponse } from '../types/restaurant';

const MIN_MESSAGE_LENGTH = 3;
const MAX_MESSAGE_LENGTH = 500;

export type ErrorKind = 'gibberish' | 'off_topic' | 'missing_location' | 'unknown_location' | 'service' | 'unknown';

const ERROR_CODE_MAP: Record<string, ErrorKind> = {
  GIBBERISH: 'gibberish',
  OFF_TOPIC: 'off_topic',
  MISSING_LOCATION: 'missing_location',
  UNKNOWN_LOCATION: 'unknown_location',
  SERVICE_ERROR: 'service',
  FOURSQUARE_ERROR: 'service',
};

function getErrorKind(status?: number, code?: string): ErrorKind {
  if (code && code in ERROR_CODE_MAP) return ERROR_CODE_MAP[code] as ErrorKind;
  if (status === 503) return 'service';
  return 'unknown';
}

interface UseRestaurantSearchReturn {
  data: SearchResponse | null;
  isLoading: boolean;
  error: string | null;
  errorKind: ErrorKind | null;
  search: (message: string) => Promise<void>;
  reset: () => void;
}

export function useRestaurantSearch(): UseRestaurantSearchReturn {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind | null>(null);

  const search = async (message: string) => {
    const trimmedMessage = message.trim();

    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) {
      setError('Please enter at least 3 characters.');
      setErrorKind('gibberish');
      return;
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError('Please keep your search under 500 characters.');
      setErrorKind('unknown');
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorKind(null);
    setData(null);

    try {
      const result = await executeSearch(trimmedMessage);
      setData(result);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status?: number; data?: { error?: string; code?: string } } };
        const status = axiosErr.response?.status;
        const code = axiosErr.response?.data?.code;
        setError(axiosErr.response?.data?.error ?? 'Something went wrong');
        setErrorKind(getErrorKind(status, code));
      } else if (err instanceof Error) {
        setError(err.message);
        setErrorKind('unknown');
      } else {
        setError('An unexpected error occurred');
        setErrorKind('unknown');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setErrorKind(null);
  };

  return { data, isLoading, error, errorKind, search, reset };
}
