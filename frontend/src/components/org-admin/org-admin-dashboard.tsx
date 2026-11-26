"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Alert, Box, Button, Divider, List, ListItem, ListItemButton, Paper, Snackbar,
  MenuItem, Stack, Tab, Tabs, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import { orgTypeLabel } from "@/lib/formatters";
import type { Organisation, Branch, Staff } from "@/types/domain";
import { updateStaffMember, type StaffChanges } from "@/features/staff/staff-api";
import { ManageRolesDialog } from "@/features/staff/manage-roles-dialog";
import { StaffListRow } from "@/components/common/staff-list-row";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusChip } from "@/components/common/status-chip";
import { useActiveContextQuery } from "@/lib/active-context";
type OrganisationOverview = Organisation & { branchCount: number; staffCount: number };
type BranchForm = Pick<Branch, "branchName" | "branchCode" | "type" | "emailId"> & { phoneNumber: string };

export function OrganisationAdminDashboard({ orgId, section }: { orgId: string; section: "Dashboard" | "Branches" | "Members" }) {
  const contextQuery = useActiveContextQuery();
  const [memberTab, setMemberTab] = useState(0);
  const [organisation, setOrganisation] = useState<OrganisationOverview | null>(null);
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [staff, setStaff] = useState<Staff[] | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>({ branchName: "", branchCode: "", type: 1, emailId: "", phoneNumber: "" });
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [savingStaffId, setSavingStaffId] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [branchError, setBranchError] = useState<string | null>(null);
  const [staffError, setStaffError] = useState<string | null>(null);
  const needsBranches = section === "Branches" || (section === "Members" && memberTab === 0);
  const needsStaff = section === "Members" && memberTab === 0;
  const loading = (section === "Dashboard" && !organisation && !overviewError) ||
    (needsBranches && !branches && !branchError) || (needsStaff && !staff && !staffError);
  const loadError = section === "Dashboard" ? overviewError : needsBranches ? branchError ?? (needsStaff ? staffError : null) : null;
  const [error, setError] = useState<string | null>(null);
  const [staffNotice, setStaffNotice] = useState("");
  const [rolePerson, setRolePerson] = useState<Staff | null>(null);

  useEffect(() => {
    let active = true;
    void api<OrganisationOverview>(`organisations/get/${orgId}?includeCounts=true`)
      .then((data) => { if (active) setOrganisation(data); })
      .catch((reason: unknown) => { if (active) setOverviewError(extractErrorMessage(reason, "Could not load the organisation.")); });
    return () => { active = false; };
  }, [orgId]);

  useEffect(() => {
    if (!needsBranches || branches) return;
    let active = true;
    void readApi<Branch[]>(`organisations/${orgId}/branches`, 30_000)
      .then((data) => { if (active) { setBranches(data); setBranchError(null); } })
      .catch((reason: unknown) => { if (active) setBranchError(extractErrorMessage(reason, "Could not load branches.")); });
    return () => { active = false; };
  }, [orgId, needsBranches, branches]);

  useEffect(() => {
    if (!needsStaff || staff) return;
    let active = true;
    void api<Staff[]>(`organisations/${orgId}/staff`)
      .then((data) => { if (active) { setStaff(data); setStaffError(null); } })
      .catch((reason: unknown) => { if (active) setStaffError(extractErrorMessage(reason, "Could not load staff.")); });
    return () => { active = false; };
  }, [orgId, needsStaff, staff]);

  const createBranch = async () => {
    setSavingBranch(true);
    setError(null);
    try {
      const created = await api<Branch>(`organisations/${orgId}/branches/create`, {
        method: "POST",
        body: JSON.stringify({ ...branchForm, phoneNumber: branchForm.phoneNumber || null }),
      });
      setBranches((current) => [...(current ?? []), created]);
      setOrganisation((current) => current ? { ...current, branchCount: current.branchCount + 1 } : current);
      setBranchDialogOpen(false);
      setBranchForm({ branchName: "", branchCode: "", type: organisation?.type ?? 1, emailId: "", phoneNumber: "" });
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not create branch."));
    } finally { setSavingBranch(false); }
  };

  const updateStaff = async (staffMember: Staff, changes: StaffChanges) => {
    setSavingStaffId(staffMember.id);
    setError(null);
    try {
      const updated = await updateStaffMember(orgId, staffMember.id, changes);
      setStaff((current) => current?.map((item) => item.id === updated.id ? updated : item) ?? null);
      setStaffNotice("Staff member updated.");
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not update staff member."));
    } finally { setSavingStaffId(null); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex" }}>

      <Box component="main" sx={{ flex: 1, minWidth: 0, maxWidth: 1360, mx: "auto", p: { xs: 2, md: 5 } }}>
        <PageHeader title={section} subtitle={organisation?.name ?? "Your organisation"} />
        {(error || loadError) && <Alert severity="error" sx={{ mb: 2 }}>{error ?? loadError}</Alert>}
        {loading ? <PanelLoading padding={10} /> : <>
          {section === "Dashboard" && <Stack spacing={2.5}>
            {organisation && <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: "12px", borderLeft: "4px solid", borderLeftColor: "primary.main" }}>
              <Typography variant="overline" color="primary.main" fontWeight={700}>ORGANISATION OVERVIEW</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{organisation.name}</Typography>
              {organisation.tagline && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{organisation.tagline}</Typography>}
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
                <Box><Typography variant="caption" color="text.secondary" display="block">TYPE</Typography><Typography>{orgTypeLabel(organisation.type)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary" display="block">EMAIL</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{organisation.emailId}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary" display="block">PHONE</Typography><Typography>{organisation.phoneNumber || "Not provided"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary" display="block">STATUS</Typography><StatusChip status={organisation.status} /></Box>
              </Box>
            </Paper>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <StatCard icon={<ApartmentOutlined />} label="Branches" value={organisation?.branchCount ?? 0} />
              <StatCard icon={<GroupsOutlined />} label="Staff members" value={organisation?.staffCount ?? 0} />
            </Stack>
          </Stack>}
          {section === "Branches" && <Paper variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2, md: 3 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box><Typography variant="h6" fontWeight={700}>Branches</Typography><Typography variant="body2" color="text.secondary">Manage branches in your organisation</Typography></Box>
                <Button variant="contained" disabled={!branches} startIcon={<AddOutlined />} onClick={() => { setError(null); setBranchForm({ branchName: "", branchCode: "", type: organisation?.type ?? 1, emailId: "", phoneNumber: "" }); setBranchDialogOpen(true); }}>Add branch</Button>
              </Stack>
              {branches?.length ? <List disablePadding sx={{ display: "grid", gap: 1.5, mt: 2 }}>{branches.map((branch) => <ListItem key={branch.id} disablePadding>
                <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}><ListItemButton component={Link} href={`/branches/${branch.id}${contextQuery}`} sx={{ display: "block", p: { xs: 2, sm: 2.5 }, "&:hover": { bgcolor: "action.hover" } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{branch.branchName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Branch code: {branch.branchCode}</Typography>
                    </Box>
                    <StatusChip status={branch.status} />
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.5fr) minmax(0, 1fr)" }, gap: { xs: 1, sm: 2 } }}>
                    <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" display="block">EMAIL</Typography><Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{branch.emailId}</Typography></Box>
                    <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" display="block">PHONE</Typography><Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{branch.phoneNumber || "Not provided"}</Typography></Box>
                  </Box>
                </ListItemButton></Paper>
              </ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No branches have been added yet.</Typography>}
          </Paper>}
          {section === "Members" && <Paper variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Members</Typography>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 1 }}><Tabs value={memberTab} onChange={(_, value) => setMemberTab(value)} aria-label="Member categories"><Tab label="Staff" /><Tab label="Students" /></Tabs></Box>
            {memberTab === 0 ? staff?.length ? <List disablePadding>{staff.map((person) => <StaffListRow key={person.id} person={person} branches={branches ?? []} disabled={savingStaffId === person.id}
              onDesignationChange={(member, designation) => { if (designation !== member.designation) void updateStaff(member, { designation }); }}
              onBranchChange={(member, branchId) => void updateStaff(member, { branchId })}
              onStatusChange={(member, status) => void updateStaff(member, { status })} onManageRoles={setRolePerson} />)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No staff members found.</Typography> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>Student records will appear here.</Typography>}
          </Paper>}
        </>}
      </Box>
      <Dialog open={branchDialogOpen} onClose={() => !savingBranch && setBranchDialogOpen(false)} fullWidth maxWidth="sm">
          <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>Add branch</Typography><DialogContentText sx={{ mt: 0.5 }}>Add a new branch to your organisation.</DialogContentText></DialogTitle>
          <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField required label="Branch name" value={branchForm.branchName} onChange={(event) => setBranchForm({ ...branchForm, branchName: event.target.value })} fullWidth />
            <TextField required label="Branch code" value={branchForm.branchCode} onChange={(event) => setBranchForm({ ...branchForm, branchCode: event.target.value })} fullWidth /></Stack>
            <TextField select label="Branch type" value={branchForm.type} onChange={(event) => setBranchForm({ ...branchForm, type: Number(event.target.value) })}><MenuItem value={1}>School</MenuItem><MenuItem value={2}>Coaching</MenuItem></TextField>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField required type="email" label="Email" value={branchForm.emailId} onChange={(event) => setBranchForm({ ...branchForm, emailId: event.target.value })} fullWidth />
            <TextField label="Phone number" value={branchForm.phoneNumber} onChange={(event) => setBranchForm({ ...branchForm, phoneNumber: event.target.value })} fullWidth /></Stack>
          </Stack></DialogContent>
          <DialogActions><Button onClick={() => setBranchDialogOpen(false)} disabled={savingBranch}>Cancel</Button><Button variant="contained" onClick={() => void createBranch()} disabled={savingBranch || !branchForm.branchName.trim() || !branchForm.branchCode.trim() || !branchForm.emailId.trim()}>{savingBranch ? "Adding…" : "Add branch"}</Button></DialogActions>
      </Dialog>
      <Snackbar open={Boolean(staffNotice)} autoHideDuration={3500} onClose={() => setStaffNotice("")} message={staffNotice} />
      <ManageRolesDialog open={Boolean(rolePerson)} orgId={orgId} person={rolePerson} branches={branches ?? []} onClose={() => setRolePerson(null)} />
    </Box>
  );
}
