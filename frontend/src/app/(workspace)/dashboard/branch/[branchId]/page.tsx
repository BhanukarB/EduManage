import { redirect } from "next/navigation";

export default async function LegacyBranchPage({ params, searchParams }: {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<{ view?: string }>;
}): Promise<never> {
  const { branchId } = await params;
  const { view } = await searchParams;
  redirect(`/branches/${encodeURIComponent(branchId)}${view === "staff" ? "?view=staff" : ""}`);
}
