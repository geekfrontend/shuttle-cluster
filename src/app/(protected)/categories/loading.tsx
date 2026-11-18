import { SKELETON_COLUMNS } from "@/app/(protected)/_components/skeletons/columns";
import { PageHeaderSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { SkeletonTableRows } from "@/components/shared/skeletons";
import { Table, TableBody } from "@/components/ui/table";

/** Kategori: heading, lalu tabel lima kategori tanpa toolbar dan pagination. */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton />
      <div className="overflow-hidden border border-border/70 bg-background">
        <Table>
          <TableBody>
            <SkeletonTableRows rows={5} columns={SKELETON_COLUMNS.categories} />
          </TableBody>
        </Table>
      </div>
    </RouteLoading>
  );
}
