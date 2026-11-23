import { requireAuth } from "@/lib/auth-server";
import { ProfileDetails } from "@/components/profile/profile-details";

export default async function ProfilePage() {
  await requireAuth();

  return <ProfileDetails />;
}
