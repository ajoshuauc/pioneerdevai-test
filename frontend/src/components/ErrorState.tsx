import type { ErrorKind } from '../hooks/useRestaurantSearch';

const HEADINGS: Record<ErrorKind, string> = {
  gibberish: 'We couldn\u2019t understand that.',
  off_topic: 'That doesn\u2019t seem food related.',
  missing_location: 'Please include a location in your search.',
  unknown_location: 'We couldn’t find that location.',
  service: 'The service is temporarily unavailable.',
  unknown: 'Something went wrong.',
};

const SUBTEXTS: Record<ErrorKind, string> = {
  gibberish: 'Try something like "sushi near me" or "Italian restaurant downtown".',
  off_topic: 'Try describing a cuisine, dish, or vibe — e.g., "cozy ramen spot in downtown LA".',
  missing_location: 'Include a city or neighborhood, e.g., "Thai food near campus, Austin".',
  unknown_location: 'Check for typos and try a city or neighborhood — e.g., "Manhattan, NYC" or "downtown Austin".',
  service: 'Please try again in a moment.',
  unknown: 'Please try again later.',
};

interface ErrorStateProps {
  message: string;
  kind?: ErrorKind;
  onRetry?: () => void;
}

export function ErrorState({ message, kind = 'unknown', onRetry }: ErrorStateProps) {
  const showRetry = kind === 'service' || kind === 'unknown';
  const heading = HEADINGS[kind];
  const subtext = SUBTEXTS[kind] || message;

  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">{heading}</p>
          <p className="text-sm text-red-600 mt-0.5">{subtext}</p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
