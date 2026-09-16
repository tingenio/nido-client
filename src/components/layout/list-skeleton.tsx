import { Skeleton } from "@/components/ui/skeleton";

type ListSkeletonProps = {
  count?: number;
};

export function ListSkeleton({ count = 3 }: ListSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
      ))}
    </div>
  );
}
