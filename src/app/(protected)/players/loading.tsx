import { SKELETON_COLUMNS } from "@/app/(protected)/_components/skeletons/columns";
import { DataTableSkeleton, PageHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";

/** Pemain: heading + tombol tambah, lalu tabel dengan filter gender. */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton actions={1} />
      <DataTableSkeleton columns={SKELETON_COLUMNS.players} filters={1} />
    </RouteLoading>
  );
}
