import { CardSkeleton, PageHeaderSkeleton, TabsSkeleton } from "@/app/(protected)/_components/skeletons/page-skeletons";
import { RouteLoading } from "@/app/(protected)/_components/skeletons/route-loading";
import { SkeletonFieldGrid, SkeletonIdentity } from "@/components/shared/skeletons";

/** Akun: heading, tiga tab, lalu kartu profil (avatar + dua field). */
export default function Loading() {
  return (
    <RouteLoading>
      <PageHeaderSkeleton />
      <TabsSkeleton tabs={3} />
      <CardSkeleton footer className="max-w-3xl">
        <SkeletonIdentity avatarClassName="size-12" />
        <SkeletonFieldGrid fields={2} />
      </CardSkeleton>
    </RouteLoading>
  );
}
