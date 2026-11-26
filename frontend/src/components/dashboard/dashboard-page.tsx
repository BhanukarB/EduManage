import { redirect } from "next/navigation";
import type { ReactElement } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { requireDashboardContext } from "@/lib/auth-server";
import { SignOutButton } from "@/components/sign-out-button";
import { SuperUserDashboard } from "@/components/super-user/super-user-dashboard";
import { OrganisationAdminDashboard } from "@/components/org-admin/org-admin-dashboard";
import { BranchDetailsPage } from "@/components/branch/branch-details-page";
import { TeachingDashboard } from "@/components/teacher/teaching-dashboard";
import type { requireActiveDashboardContext } from "@/lib/auth-server";

type ActiveContext = Awaited<ReturnType<typeof requireActiveDashboardContext>>;

export default async function DashboardPage({ section, context }: { section: "Dashboard" | "Branches" | "Members" | "Organisations" | "Role Manager"; context?: ActiveContext }): Promise<ReactElement> {
  const { superUser, manager, organisationId, teacher, pendingBranch } = context ?? await requireDashboardContext();
  if (section === "Role Manager" || section === "Organisations") {
    if (!superUser) redirect("/dashboard");
    return <SuperUserDashboard activeSection={section} />;
  }
  if (section !== "Dashboard" && (superUser || manager || !organisationId)) redirect("/dashboard");
  if (superUser) return <SuperUserDashboard activeSection="Organisations" />;
  if (manager) return <BranchDetailsPage key={`${manager.orgId}:${manager.branchId}`} {...manager} branchManager />;
  if (teacher) return <TeachingDashboard key={`${teacher.orgId}:${teacher.branchId}`} {...teacher} />;
  if (organisationId) return <OrganisationAdminDashboard key={organisationId} orgId={organisationId} section={section} />;

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: 8 }}>
      <Container maxWidth="md">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>
            CLASSMANAGE
          </Typography>
          <SignOutButton />
        </Stack>
        <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, border: "1px solid", borderColor: "divider" }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            You’re signed in
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {pendingBranch ? "Choose a branch from the sidebar to continue." : "Your ClassManage workspace is ready."}
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}
