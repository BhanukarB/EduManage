"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { useEffect, useState } from "react";
import { Alert, Box, Breadcrumbs, Button, Divider, Link as MuiLink, List, ListItem, ListItemText, Paper, Snackbar, Stack, Typography } from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { ProfileLink } from "@/components/profile-link";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import type { Branch, Role, Staff } from "@/types/domain";
import { AddStaffDialog, type AddStaffForm } from "@/features/staff/add-staff-dialog";
import { updateStaffMember, type StaffChanges } from "@/features/staff/staff-api";
import { StaffListRow } from "@/components/common/staff-list-row";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusChip } from "@/components/common/status-chip";
import Link from "next/link";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { readBranchIdentity, readBranchSummary, type BranchSummary } from "./branch-data";

type BranchOption = Pick<Branch, "id" | "branchName">;
export function BranchDetailsPage({ orgId, branchId, email, branchManager = false, initialStaffView = false }: { orgId: string; branchId: string; email?: string; branchManager?: boolean; initialStaffView?: boolean }) {
  const [branchName, setBranchName] = useState<string | null>(null);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchRoles, setBranchRoles] = useState<Role[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [staffView, setStaffView] = useState(initialStaffView);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [staffNotice, setStaffNotice] = useState("");
  useEffect(() => {
    if (staffView || summary) return;
    let active = true;
    void readBranchSummary(orgId, branchId, branchManager)
      .then((data) => { if (active) { setSummary(data); setBranchName(data.branch.branchName); setSummaryError(null); } })
      .catch((reason: unknown) => { if (active) setSummaryError(extractErrorMessage(reason, "Could not load branch details.")); });
    return () => { active = false; };
  }, [orgId, branchId, branchManager, staffView, summary]);

  useEffect(() => {
    if (!staffView) return;
    let active = true;
    const load = async (): Promise<void> => {
      if (!active) return;
      setStaffLoading(true);
      setError(null);
      try {
        const [members, options] = await Promise.all([
          api<Staff[]>(`organisations/${orgId}/staff?branchId=${branchId}`),
          branchManager
            ? readBranchIdentity(orgId, branchId).then((branch) => [{ id: branchId, branchName: branch.branchName }])
            : readApi<BranchOption[]>(`organisations/${orgId}/branches`, 30_000),
        ]);
        if (active) {
          setStaff(members);
          setBranches(options);
          setBranchName((name) => name ?? options.find((branch) => branch.id === branchId)?.branchName ?? null);
        }
      } catch (reason) {
        if (active) setError(extractErrorMessage(reason, "Could not load branch staff."));
      } finally {
        if (active) setStaffLoading(false);
      }
    };
    void Promise.resolve().then(load);
    return () => { active = false; };
  }, [orgId, branchId, branchManager, staffView]);

  const openAddStaff = async (): Promise<void> => {
    setDialogError(null);
    setAddDialogOpen(true);
    setRolesLoading(true);
    try {
      setBranchRoles(await readApi<Role[]>("rbac/branch-roles", 30_000));
    } catch (reason) {
      setDialogError(extractErrorMessage(reason, "Could not load branch roles."));
    } finally {
      setRolesLoading(false);
    }
  };

  const updateStaff = async (person: Staff, changes: StaffChanges) => {
    setSaving(true); setError(null);
    try {
      const updated = await updateStaffMember(orgId, person.id, changes);
      setStaff((current) => current.map((item) => item.id === person.id ? updated : item).filter((item) => item.branchId === branchId));
      setStaffNotice("Staff member updated.");
      if (person.branchId === branchId && updated.branchId !== branchId) {
        setSummary((current) => current ? { ...current, staffCount: Math.max(0, current.staffCount - 1) } : current);
      }
    } catch (reason) { setError(extractErrorMessage(reason, "Could not update staff.")); }
    finally { setSaving(false); }
  };

  const addStaff = async (staffForm: AddStaffForm): Promise<boolean> => {
    setSaving(true); setDialogError(null);
    try {
      const created = await api<Staff>("organisations/staff/add", { method: "POST", body: JSON.stringify({ ...staffForm, orgId, branchId, phoneNumber: staffForm.phoneNumber || null }) });
      setStaff((current) => [...current, created]);
      setSummary((current) => current ? { ...current, staffCount: current.staffCount + 1 } : current);
      setAddDialogOpen(false);
      return true;
    } catch (reason) {
      setDialogError(extractErrorMessage(reason, "Could not add staff."));
      return false;
    }
    finally { setSaving(false); }
  };

  return <BranchWorkspace active={staffView ? "Staff" : "Dashboard"} email={email} maxWidth={1200}
    showSidebar={branchManager} onDashboard={() => setStaffView(false)}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="Breadcrumb">
          <MuiLink component={Link} href="/dashboard" underline="hover" color="inherit">Dashboard</MuiLink>
          <MuiLink component={Link} href="/dashboard" underline="hover" color="inherit">Branches</MuiLink>
          {branchName && <Typography color="text.primary">{branchName}</Typography>}
        </Breadcrumbs>
        <ProfileLink email={email} />
      </Stack>
      {(error || (!staffView && summaryError)) && <Alert severity="error" sx={{ mt: 2 }}>{error ?? summaryError}</Alert>}
      {!staffView && !summary && !summaryError && <PanelLoading padding={12} />}
      {staffView && <PageHeader title={branchName ? `Staff at ${branchName}` : "Staff"} />}
      {(!staffView && summary) && <PageHeader title={summary.branch.branchName} subtitle={`Branch code: ${summary.branch.branchCode}`} action={<StatusChip status={summary.branch.status} />} />}
      {(staffView || summary) && <>
        {!staffView && summary ? <><Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          <StatCard icon={<GroupsOutlined />} label="Staff" value={summary.staffCount} onClick={() => setStaffView(true)} />
          <StatCard icon={<SchoolOutlined />} label="Students" value={summary.studentCount} />
          <StatCard icon={<ApartmentOutlined />} label="Classes" value={(summary.classCount ?? summary.classes?.length ?? 0)} />
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px", mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Branch information</Typography><Divider sx={{ my: 2 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}><Box><Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{summary.branch.emailId}</Typography></Box><Box><Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{summary.branch.phoneNumber || "Not provided"}</Typography></Box></Box>
        </Paper>
        {!branchManager && <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}>
          <Typography variant="h6" fontWeight={700}>Classes</Typography>
          {summary.classes?.length ? <List disablePadding>{summary.classes.map((item) => <ListItem key={item.id} divider><ListItemText primary={item.className} secondary={`Class code: ${item.classCode}`} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No classes are linked to this branch yet.</Typography>}
        </Paper>}
        </> : <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
            <Button onClick={() => setStaffView(false)}>Back to branch</Button>
            <Button variant="contained" disabled={staffLoading || !branchName} onClick={() => void openAddStaff()}>Add staff</Button>
          </Stack>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}>
            {staffLoading ? <PanelLoading padding={4} /> : staff.length ? <List disablePadding>{staff.map((person) => <StaffListRow key={person.id} person={person} branches={branches} disabled={saving}
              onDesignationChange={(member, designation) => { if (designation !== member.designation) void updateStaff(member, { designation }); }}
              onBranchChange={(member, branchId) => void updateStaff(member, { branchId })}
              onStatusChange={(member, status) => void updateStaff(member, { status })} />)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No staff are assigned to this branch.</Typography>}
          </Paper>
        </>}
      </>}
    {branchName && <AddStaffDialog open={addDialogOpen} branchName={branchName} branchRoles={branchRoles}
      rolesLoading={rolesLoading} saving={saving} error={dialogError}
      onClose={() => setAddDialogOpen(false)} onSave={addStaff} />}
    <Snackbar open={Boolean(staffNotice)} autoHideDuration={3500} onClose={() => setStaffNotice("")} message={staffNotice} />
  </BranchWorkspace>;
}
