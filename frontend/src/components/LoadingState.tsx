export function LoadingState() {
  return (
    <div className="w-full space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-44" />
          <div className="h-3 bg-gray-200 rounded w-32" />
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-56" />
        </div>
      ))}
    </div>
  );
}
