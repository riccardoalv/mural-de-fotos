export function SkeletonLoader() {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
      {Array.from({ length: 10 }).map((_, index) => (
        <div key={index} className="break-inside-avoid mb-4">
          <div className="w-full h-48 bg-gray-300 animate-pulse rounded-lg" />
          <div className="mt-2 h-4 bg-gray-300 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}
