import type { ErrorKind } from '../hooks/useRestaurantSearch';

const HEADINGS: Record<ErrorKind, string> = {
  gibberish: 'We couldn’t understand your search.',
  off_topic: 'That doesn’t seem food related.',
  missing_location: 'Please include a location in your search.',
  service: 'The service is temporarily unavailable. Please try again.',
  unknown: 'Something went wrong. Please try again.',
};

interface ErrorStateProps {
  message: string;
  kind?: ErrorKind;
  onRetry?: () => void;
}

export function ErrorState({ message, kind = 'unknown', onRetry }: ErrorStateProps) {
  const showRetry = kind === 'service' || kind === 'unknown';

  return (
    <div className="w-full max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p className="text-red-800 font-medium mb-1">{HEADINGS[kind]}</p>
      <p className="text-red-600 text-sm mb-4">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
