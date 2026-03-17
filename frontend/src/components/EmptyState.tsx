export function EmptyState() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
      <p className="text-gray-500 text-lg mb-2">No restaurants found</p>
      <p className="text-gray-400 text-sm">Try adjusting your search — different cuisine, location, or fewer filters.</p>
    </div>
  );
}
