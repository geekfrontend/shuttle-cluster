import { SKELETON_COLUMNS } from "@/app/(protected)/_components/skeletons/columns";
import { DataTableSkeleton, PageHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";

/** Pertandingan: heading + tombol catat, lalu tabel dengan filter kategori. */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton actions={1} />
      <DataTableSkeleton columns={SKELETON_COLUMNS.matches} filters={1} />
    </RouteLoading>
  );
}
