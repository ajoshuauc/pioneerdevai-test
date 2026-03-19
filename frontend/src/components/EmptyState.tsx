export function EmptyState() {
  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-8 text-center">
      <p className="text-gray-500 text-base mb-1">No restaurants found</p>
      <p className="text-gray-400 text-sm">Try adjusting your search — different cuisine, location, or fewer filters.</p>
    </div>
  );
}
