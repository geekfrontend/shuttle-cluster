import { SKELETON_COLUMNS } from "@/app/(protected)/_components/skeletons/columns";
import { DataTableSkeleton, PageHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";

/** Pengguna: heading + tombol tambah, lalu tabel dengan dua filter (role, status). */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton actions={1} />
      <DataTableSkeleton columns={SKELETON_COLUMNS.users} filters={2} />
    </RouteLoading>
  );
}
