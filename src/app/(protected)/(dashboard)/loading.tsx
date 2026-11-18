import { CardSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Dasbor: sapaan, chart cluster per kategori & pertandingan per tahun, dan tautan cepat. Skeleton umum untuk halaman lain ada di `(protected)/loading.tsx`. */
export default function Loading() {
  return (
    <RouteLoading>
      <div className="grid gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-4">
          <CardSkeleton className="h-80">
            <Skeleton className="h-56 w-full" />
          </CardSkeleton>
          <CardSkeleton className="h-72">
            <Skeleton className="h-48 w-full" />
          </CardSkeleton>
        </div>
        <Card>
          <CardHeader className="border-b">
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent className="grid gap-1 px-2">
            {Array.from({ length: 5 }, (_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: placeholder statis
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton className="size-8 shrink-0" />
                <div className="grid flex-1 gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </RouteLoading>
  );
}
