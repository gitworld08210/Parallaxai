/**
 * Skeleton that matches PostCard dimensions exactly — no layout shift on load.
 */
export const PostCardSkeleton = () => (
  <article className="bg-card px-4 pt-3 pb-3">
    <header className="flex items-center gap-3 py-2.5">
      <div className="h-10 w-10 rounded-full shimmer-skeleton" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-28 rounded shimmer-skeleton" />
        <div className="h-2.5 w-16 rounded shimmer-skeleton opacity-70" />
      </div>
    </header>
    <div className="w-full aspect-square rounded-2xl shimmer-skeleton" />
    <div className="flex items-center gap-1 pt-3 pb-2">
      <div className="h-6 w-6 rounded shimmer-skeleton" />
      <div className="h-6 w-6 rounded shimmer-skeleton ml-2 opacity-80" />
      <div className="h-6 w-6 rounded shimmer-skeleton ml-2 opacity-60" />
      <div className="h-6 w-6 rounded shimmer-skeleton ml-auto opacity-70" />
    </div>
    <div className="h-3 w-24 rounded shimmer-skeleton mt-1" />
    <div className="h-3 w-3/4 rounded shimmer-skeleton mt-2 opacity-80" />
    <div className="h-3 w-2/5 rounded shimmer-skeleton mt-2 mb-5 opacity-60" />
  </article>
);

export const FeedSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="divide-y divide-border">
    {Array.from({ length: count }).map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);
