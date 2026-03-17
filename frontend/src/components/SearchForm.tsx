import { useState } from 'react';

interface SearchFormProps {
  onSearch: (message: string) => void;
  isLoading: boolean;
}

const MIN_MESSAGE_LENGTH = 3;
const MAX_MESSAGE_LENGTH = 500;

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [message, setMessage] = useState('');
  const trimmedMessage = message.trim();
  const hasMessage = trimmedMessage.length > 0;
  const isTooShort = hasMessage && trimmedMessage.length < MIN_MESSAGE_LENGTH;
  const isTooLong = message.length > MAX_MESSAGE_LENGTH;
  const validationMessage = isTooShort
    ? 'Please enter at least 3 characters.'
    : isTooLong
      ? 'Please keep your search under 500 characters.'
      : null;
  const isSubmitDisabled = isLoading || !hasMessage || isTooShort || isTooLong;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;
    onSearch(trimmedMessage);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-3">
        <label htmlFor="search-input" className="text-sm font-medium text-gray-700">
          What are you looking for?
        </label>
        <textarea
          id="search-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder='e.g. "Find me a cheap sushi restaurant in downtown Los Angeles that is open now"'
          rows={3}
          maxLength={MAX_MESSAGE_LENGTH}
          aria-invalid={validationMessage ? 'true' : 'false'}
          aria-describedby="search-input-help"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
          disabled={isLoading}
        />
        <div id="search-input-help" className="flex items-center justify-between text-sm">
          <span className={validationMessage ? 'text-red-600' : 'text-gray-500'}>
            {validationMessage ?? 'Enter between 3 and 500 characters.'}
          </span>
          <span className="text-gray-400">{message.length}/500</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Searching...' : 'Search Restaurants'}
        </button>
      </div>
    </form>
  );
}
