import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dasbor: sapaan dan tautan cepat. Juga menjadi fallback untuk route di bawah `(protected)` yang tidak
 * punya `loading.tsx` sendiri.
 */
export default function Loading() {
  return (
    <RouteLoading>
      <div className="grid gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Card className="max-w-md">
        <CardHeader className="border-b">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="grid gap-1 px-2">
          {Array.from({ length: 2 }, (_, index) => (
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
    </RouteLoading>
  );
}
