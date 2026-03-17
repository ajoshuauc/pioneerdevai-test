export function LoadingState() {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-5 animate-pulse">
          <div className="flex justify-between items-start mb-3">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-5 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-64 mb-3" />
          <div className="flex gap-3">
            <div className="h-3 bg-gray-200 rounded w-12" />
            <div className="h-3 bg-gray-200 rounded w-16" />
            <div className="h-3 bg-gray-200 rounded w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}
