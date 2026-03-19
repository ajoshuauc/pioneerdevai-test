import { SearchForm } from './components/SearchForm'
import { SearchSummary } from './components/SearchSummary'
import { RestaurantCard } from './components/RestaurantCard'
import { LoadingState } from './components/LoadingState'
import { ErrorState } from './components/ErrorState'
import { EmptyState } from './components/EmptyState'
import { useRestaurantSearch } from './hooks/useRestaurantSearch'

function App() {
  const { data, isLoading, error, errorKind, search, reset } = useRestaurantSearch()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900">🍽️ Restaurant Finder</h1>
          <p className="text-gray-500 mt-1">Describe what you're looking for in plain English</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <SearchForm onSearch={search} isLoading={isLoading} />

        {isLoading && <LoadingState />}

        {error && <ErrorState message={error} kind={errorKind ?? undefined} onRetry={reset} />}

        {data && (
          <>
            <SearchSummary interpreted={data.interpreted} />

            {data.results.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {data.totalResults} result{data.totalResults !== 1 ? 's' : ''} found
                </p>
                {data.results.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App

