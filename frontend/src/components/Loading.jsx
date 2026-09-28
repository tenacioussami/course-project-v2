// Small inline spinner (kept for backwards compatibility)
const Loading = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center py-16">
    <div className="flex items-center gap-3 text-slate-400">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  </div>
);

export const Skeleton = ({ className = '' }) => <div className={`skeleton ${className}`} />;

/** Shown while a page's code chunk or first data is loading. */
export const PageSkeleton = () => (
  <div className="animate-fade-up space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-9 w-72" />
    </div>
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card space-y-3 p-5">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  </div>
);

export const CardGridSkeleton = ({ count = 6, tall = false }) => (
  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card space-y-3 p-5">
        {tall && <Skeleton className="h-32 w-full rounded-xl" />}
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    ))}
  </div>
);

export const ListSkeleton = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="card flex items-center gap-4 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

export default Loading;
