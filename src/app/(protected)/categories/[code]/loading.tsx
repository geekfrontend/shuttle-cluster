import { DetailHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Detail kategori: heading + kembali, tiga kartu tingkat performa, lalu area data pertandingan. */
export default function Loading() {
  return (
    <RouteLoading>
      <DetailHeaderSkeleton badges={1} />
      <div className="grid gap-3">
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
              <CardContent className="grid gap-1.5">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <Skeleton className="h-72 w-full" />
    </RouteLoading>
  );
}
