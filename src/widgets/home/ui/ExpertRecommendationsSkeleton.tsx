export default function ExpertRecommendationsSkeleton() {
  return (
    <div className="px-2.5 pt-3 pb-5">
      <p className="text-sm font-semibold text-neutral-900">현직자 추천</p>
      <div className="mt-3 flex items-start gap-3 overflow-x-auto pb-2 pr-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="flex min-w-[92px] flex-col items-center gap-2">
            <div className="h-[74px] w-[74px] rounded-full bg-neutral-200 animate-pulse" />
            <div className="h-3 w-16 rounded-full bg-neutral-200 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
