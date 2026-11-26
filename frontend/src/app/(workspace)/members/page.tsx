import type { ReactElement } from "react";
import DashboardPage from "@/components/dashboard/dashboard-page";
import { requireActiveDashboardContext } from "@/lib/auth-server";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<ReactElement> {
  const params = await searchParams;
  return <DashboardPage section="Members" context={await requireActiveDashboardContext(params)} />;
}
