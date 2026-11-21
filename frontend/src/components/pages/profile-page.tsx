import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { ProfileDetails } from "@/components/pages/profile-details";

export default async function ProfilePage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/");

  return <ProfileDetails />;
}
