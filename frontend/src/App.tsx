import { useState, useEffect } from 'react'
import { SearchForm } from './components/SearchForm'
import { SearchSummary } from './components/SearchSummary'
import { RestaurantCard } from './components/RestaurantCard'
import { LoadingState } from './components/LoadingState'
import { ErrorState } from './components/ErrorState'
import { EmptyState } from './components/EmptyState'
import { useRestaurantSearch } from './hooks/useRestaurantSearch'

function App() {
  const { data, isLoading, error, errorKind, search, reset } = useRestaurantSearch()
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FBF9F7]">
      <main className="max-w-2xl mx-auto px-4 pt-12 pb-16 space-y-6">
        {/* Logo & tagline */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="w-10 h-10 bg-[#E8825C] rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2v0a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-gray-900">Dine</span>
              <span className="text-[#E8825C]">Scout</span>
            </h1>
          </div>
          <p className="text-gray-400 italic text-sm">
            Describe what you&apos;re craving and we&apos;ll find the perfect spot.
          </p>
        </div>

        {/* How to search */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5 mb-1.5">
            🔍 How to search
          </h2>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              Write a natural prompt describing what you want — cuisine, dish, price level, number of results, open status, or to sort by distance (nearest).{' '}
              <strong className="text-gray-800">Always include a location</strong>{' '}
              for best results.
            </p>
        </div>

        {/* Search */}
        <SearchForm onSearch={search} isLoading={isLoading} />

        {/* Loading */}
        {isLoading && <LoadingState />}

        {/* Error */}
        {error && <ErrorState message={error} kind={errorKind ?? undefined} onRetry={reset} />}

        {/* Results */}
        {data && (
          <>
            <SearchSummary interpreted={data.interpreted} />

            {data.results.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {data.totalResults} restaurant{data.totalResults !== 1 ? 's' : ''} found
                </p>
                {data.results.map((restaurant) => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Scroll to top button */}
      {isScrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#E8825C] text-white rounded-full shadow-lg hover:bg-[#D97048] transition-all animate-in fade-in duration-300 flex items-center justify-center"
          title="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default App

