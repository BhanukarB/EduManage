import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-server";
import { SignOutButton } from "@/components/sign-out-button";
import { SuperUserDashboard } from "@/components/super-user-dashboard";
import { ProfileLink } from "@/components/profile-link";
import { OrganisationAdminDashboard } from "@/components/organisation-admin-dashboard";

function hasSuperUserRole(token?: string) {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      roles?: unknown;
      role_names?: unknown;
      email?: unknown;
    };
    const roles = [
      ...(Array.isArray(claims.roles) ? claims.roles : []),
      ...(Array.isArray(claims.role_names) ? claims.role_names : []),
    ];
    return roles.includes("super_user") || roles.includes("super_admin");
  } catch {
    return false;
  }
}

function getOrganisationAdminOrgId(token?: string) {
  if (!token) return false;
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { roles?: unknown; role_names?: unknown; orgId?: unknown };
    const roles = [...(Array.isArray(claims.roles) ? claims.roles : []), ...(Array.isArray(claims.role_names) ? claims.role_names : [])];
    return roles.includes("org_admin") && typeof claims.orgId === "string" ? claims.orgId : null;
  } catch { return null; }
}

export default async function DashboardPage() {
  const jar = await cookies();
  if (!jar.has(ACCESS_COOKIE) && !jar.has(REFRESH_COOKIE)) redirect("/");

  const accessToken = jar.get(ACCESS_COOKIE)?.value;
  let email: string | undefined;
  try {
    const payload = accessToken?.split(".")[1];
    if (payload) {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { email?: unknown };
      if (typeof claims.email === "string") email = claims.email;
    }
  } catch {
    // Profile link remains available when optional display claims are missing.
  }

  if (hasSuperUserRole(accessToken)) return <SuperUserDashboard email={email} />;
  const organisationId = getOrganisationAdminOrgId(accessToken);
  if (organisationId) return <OrganisationAdminDashboard email={email} orgId={organisationId} />;

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: 8 }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>
            CLASSMANAGE
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <ProfileLink email={email} />
            <SignOutButton />
          </Stack>
        </Stack>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            You’re signed in
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Your ClassManage workspace is ready.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
