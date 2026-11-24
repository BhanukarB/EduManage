import { redirect } from "next/navigation";

export default async function LegacyClassDetailsRoute({ params }: {
  params: Promise<{ classId: string }>;
}): Promise<never> {
  const { classId } = await params;
  redirect(`/classes/${encodeURIComponent(classId)}`);
}
