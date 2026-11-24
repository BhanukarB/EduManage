import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { requireDashboardContext } from "@/lib/auth-server";
import { SignOutButton } from "@/components/sign-out-button";
import { SuperUserDashboard } from "@/components/super-user/super-user-dashboard";
import { ProfileLink } from "@/components/profile-link";
import { OrganisationAdminDashboard } from "@/components/org-admin/org-admin-dashboard";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";

export default async function DashboardPage() {
  const { email, superUser, manager, organisationId } = await requireDashboardContext();
  if (superUser) return <SuperUserDashboard email={email} />;
  if (manager) return <BranchDetailsPage {...manager} email={email} branchManager />;
  if (organisationId) return <OrganisationAdminDashboard key={organisationId} email={email} orgId={organisationId} />;

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
