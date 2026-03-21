import { useState } from 'react';

interface SearchFormProps {
  onSearch: (message: string) => void;
  isLoading: boolean;
}

const MIN_MESSAGE_LENGTH = 3;
const MAX_MESSAGE_LENGTH = 500;

const QUICK_QUERIES = [
  { label: 'Cheap sushi near Times Square, NYC', value: 'Cheap sushi near Times Square, NYC' },
  { label: 'Cozy Italian restaurant in downtown Portland', value: 'Cozy Italian restaurant in downtown Portland' },
  { label: 'Fancy seafood for a date in Miami', value: 'Fancy seafood for a date in Miami' },
];

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [message, setMessage] = useState('');
  const trimmedMessage = message.trim();
  const hasMessage = trimmedMessage.length > 0;
  const isTooShort = hasMessage && trimmedMessage.length < MIN_MESSAGE_LENGTH;
  const isTooLong = message.length > MAX_MESSAGE_LENGTH;
  const isSubmitDisabled = isLoading || !hasMessage || isTooShort || isTooLong;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    onSearch(trimmedMessage);
  };

  const handleQuickQuery = (value: string) => {
    setMessage(value);
    onSearch(value);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            id="search-input"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Try "Cozy Italian place near Manhattan" or "Cheap steakhouse open now in Austin"'
            maxLength={MAX_MESSAGE_LENGTH}
            aria-invalid={isTooShort || isTooLong ? 'true' : 'false'}
            className="w-full pl-11 pr-10 py-3.5 border-2 border-[#E8825C] rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8825C]/30 focus:border-[#E8825C] text-sm"
            disabled={isLoading}
          />
          {message && (
            <button
              type="button"
              onClick={() => setMessage('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="px-7 py-3.5 bg-[#E8825C] text-white font-medium rounded-xl shadow-sm hover:bg-[#D97048] focus:ring-2 focus:ring-[#E8825C]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm whitespace-nowrap"
        >
          {isLoading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Quick test queries */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quick test queries:
        </span>
        {QUICK_QUERIES.map((q) => (
          <button
            key={q.value}
            type="button"
            onClick={() => handleQuickQuery(q.value)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 font-mono"
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
