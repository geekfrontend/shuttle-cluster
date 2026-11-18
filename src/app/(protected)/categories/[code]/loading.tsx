import { DetailHeaderSkeleton, TabsSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Detail kategori: heading + kembali, baris filter, ringkasan periode, tab, lalu tiga kartu cluster. */
export default function Loading() {
  return (
    <RouteLoading>
      <DetailHeaderSkeleton badges={1} />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-7 w-36" />
        </div>
        <Skeleton className="h-3 w-96 max-w-full" />
      </div>
      <TabsSkeleton tabs={3} />
      <div className="grid gap-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
          <Card key={index}>
            <CardHeader className="gap-2 border-b">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-3 w-full" />
            </CardHeader>
            <CardContent className="grid gap-3">
              <Skeleton className="h-8 w-20" />
              <div className="grid grid-cols-3 gap-2 border-t pt-3">
                {Array.from({ length: 3 }, (_, stat) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
                  <div key={stat} className="grid gap-1">
                    <Skeleton className="h-2.5 w-12" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </RouteLoading>
  );
}
