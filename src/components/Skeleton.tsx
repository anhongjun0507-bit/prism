/**
 * Skeleton presets for common loading layouts.
 * 각 inner element는 .shimmer를 사용해 brand-tinted sweep을 받음.
 */
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-card rounded-2xl shadow-sm flex items-center gap-4"
          style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}
        >
          <div className="w-11 h-11 rounded-xl shimmer shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 shimmer rounded-full w-2/3" />
            <div className="h-2.5 shimmer rounded-full w-1/2" />
          </div>
          <div className="h-6 w-14 shimmer rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-end"><div className="h-10 w-48 shimmer rounded-2xl rounded-tr-none" /></div>
      <div className="flex justify-start"><div className="h-16 w-56 shimmer rounded-2xl rounded-tl-none" /></div>
      <div className="flex justify-end"><div className="h-10 w-36 shimmer rounded-2xl rounded-tr-none" /></div>
    </div>
  );
}
