import { requireUserId } from "@/lib/requireUser";
import { DashboardContent } from "./DashboardContent";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requireUserId();

  return <DashboardContent userId={userId} searchParams={searchParams} />;
}
