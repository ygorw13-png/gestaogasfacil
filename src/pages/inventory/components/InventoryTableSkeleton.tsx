import { Skeleton } from "@/components/ui/skeleton";

interface InventoryTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function InventoryTableSkeleton({ rows = 5, columns = 5 }: InventoryTableSkeletonProps) {
  return (
    <div className="w-full space-y-3" aria-busy="true" aria-label="Carregando dados">
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={`r-${r}`} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={`c-${r}-${c}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
