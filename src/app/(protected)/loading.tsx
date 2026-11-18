import { PageHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton umum: judul halaman lalu area konten. Tampil saat berpindah ke halaman yang skeleton-nya belum
 * diketahui (link sidebar tidak di-prefetch) dan untuk route tanpa `loading.tsx` sendiri. Skeleton dasbor ada di
 * `(dashboard)/loading.tsx` supaya tidak muncul di halaman lain.
 */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-7 w-32" />
      </div>
      <Skeleton className="h-96 w-full" />
    </RouteLoading>
  );
}
