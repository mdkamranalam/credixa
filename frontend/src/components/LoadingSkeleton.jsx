const LoadingSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-full w-10"></div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          </div>
          <div className="space-y-8">
            <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
