"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Breadcrumbs, Button, CircularProgress, Divider, Link as MuiLink, List, ListItem, ListItemText, Paper, Snackbar, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField, MenuItem } from "@mui/material";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { ProfileLink } from "@/components/profile-link";
import { api, extractErrorMessage } from "@/lib/api";
import type { Branch, Role, Staff } from "@/types/domain";
import { StaffListRow } from "@/components/common/staff-list-row";
import { statusLabel } from "@/lib/formatters";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusChip } from "@/components/common/status-chip";
import Link from "next/link";

type BranchSummary = {
  branch: { branchName: string; branchCode: string; emailId: string; phoneNumber?: string | null; status: number };
  staffCount: number;
  studentCount: number;
  classes: { id: string; className: string; classCode: string }[];
};
type BranchOption = Pick<Branch, "id" | "branchName">;

export function BranchDetailsPage({ orgId, branchId, email }: { orgId: string; branchId: string; email?: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchRoles, setBranchRoles] = useState<Role[]>([]);
  const [staffView, setStaffView] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffForm, setStaffForm] = useState({ firstName: "", lastName: "", emailId: "", phoneNumber: "", designation: "", joiningDate: new Date().toISOString().slice(0, 10), roleId: "" });
  const [error, setError] = useState<string | null>(null);
  const [staffNotice, setStaffNotice] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      api<BranchSummary>(`organisations/${orgId}/branches/${branchId}/summary`),
      api<Staff[]>(`organisations/${orgId}/staff`),
      api<BranchOption[]>(`organisations/${orgId}/branches`),
      api<Role[]>("rbac/branch-roles"),
    ]).then(([summary, staffList, branchList, roles]) => { if (active) { setSummary(summary); setStaff(staffList.filter((person) => person.branchId === branchId)); setBranches(branchList); setBranchRoles(roles); } })
      .catch((reason: unknown) => { if (active) setError(extractErrorMessage(reason, "Could not load branch details.")); });
    return () => { active = false; };
  }, [orgId, branchId]);

  const updateStaff = async (person: Staff, changes: Partial<Pick<Staff, "status" | "designation" | "branchId">>) => {
    setSaving(true); setError(null);
    try {
      const updated = await api<Staff>("organisations/staff/update", { method: "PUT", body: JSON.stringify({ orgId, staffId: person.id, ...changes }) });
      setStaff((current) => current.map((item) => item.id === person.id ? updated : item).filter((item) => item.branchId === branchId));
      setStaffNotice("Staff member updated.");
      if (person.branchId === branchId && updated.branchId !== branchId) {
        setSummary((current) => current ? { ...current, staffCount: Math.max(0, current.staffCount - 1) } : current);
      }
    } catch (reason) { setError(extractErrorMessage(reason, "Could not update staff.")); }
    finally { setSaving(false); }
  };

  const addStaff = async () => {
    setSaving(true); setError(null);
    try {
      const created = await api<Staff>("organisations/staff/add", { method: "POST", body: JSON.stringify({ ...staffForm, orgId, branchId, phoneNumber: staffForm.phoneNumber || null }) });
      setStaff((current) => [...current, created]);
      setSummary((current) => current ? { ...current, staffCount: current.staffCount + 1 } : current);
      setAddDialogOpen(false);
      setStaffForm({ firstName: "", lastName: "", emailId: "", phoneNumber: "", designation: "", joiningDate: new Date().toISOString().slice(0, 10), roleId: "" });
    } catch (reason) { setError(extractErrorMessage(reason, "Could not add staff.")); }
    finally { setSaving(false); }
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "background.default", p: { xs: 2, md: 4 } }}>
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="Breadcrumb">
          <MuiLink component={Link} href="/dashboard" underline="hover" color="inherit">Dashboard</MuiLink>
          <MuiLink component={Link} href="/dashboard" underline="hover" color="inherit">Branches</MuiLink>
          {summary && <Typography color="text.primary">{summary.branch.branchName}</Typography>}
        </Breadcrumbs>
        <ProfileLink email={email} />
      </Stack>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {!summary && !error ? <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box> : summary && <>
          <PageHeader title={staffView ? `Staff at ${summary.branch.branchName}` : summary.branch.branchName} subtitle={staffView ? undefined : `Branch code: ${summary.branch.branchCode}`} action={!staffView ? <StatusChip status={summary.branch.status} /> : undefined} />
        {!staffView ? <><Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          <StatCard icon={<GroupsOutlined />} label="Staff" value={summary.staffCount} onClick={() => setStaffView(true)} />
          <StatCard icon={<SchoolOutlined />} label="Students" value={summary.studentCount} />
          <StatCard icon={<ApartmentOutlined />} label="Classes" value={summary.classes.length} />
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px", mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Branch information</Typography><Divider sx={{ my: 2 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}><Box><Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{summary.branch.emailId}</Typography></Box><Box><Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{summary.branch.phoneNumber || "Not provided"}</Typography></Box></Box>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}>
          <Typography variant="h6" fontWeight={700}>Classes</Typography>
          {summary.classes.length ? <List disablePadding sx={{ display: "grid", gap: 1.5, mt: 2 }}>{summary.classes.map((item) => <Paper key={item.id} variant="outlined"><ListItem><ListItemText primary={item.className} primaryTypographyProps={{ variant: "subtitle1" }} secondary={`Class code: ${item.classCode}`} /></ListItem></Paper>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No classes are linked to this branch yet.</Typography>}
        </Paper>
        </> : <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
            <Button startIcon={<ArrowBackOutlined />} onClick={() => setStaffView(false)}>Back to branch</Button>
            <Button variant="contained" onClick={() => setAddDialogOpen(true)}>Add staff</Button>
          </Stack>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}>
            {staff.length ? <List disablePadding>{staff.map((person) => <StaffListRow key={person.id} person={person} branches={branches} disabled={saving}
              onDesignationChange={(member, designation) => { if (designation !== member.designation) void updateStaff(member, { designation }); }}
              onBranchChange={(member, branchId) => void updateStaff(member, { branchId })}
              onStatusChange={(member, status) => void updateStaff(member, { status })} />)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No staff are assigned to this branch.</Typography>}
          </Paper>
        </>}
      </>}
    </Box>
    <Dialog open={addDialogOpen} onClose={() => !saving && setAddDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>Add staff to {summary?.branch.branchName}</Typography><DialogContentText sx={{ mt: 0.5 }}>Add a team member and assign their branch role.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        <TextField required label="First name" value={staffForm.firstName} onChange={(event) => setStaffForm({ ...staffForm, firstName: event.target.value })} />
        <TextField required label="Last name" value={staffForm.lastName} onChange={(event) => setStaffForm({ ...staffForm, lastName: event.target.value })} />
        <TextField required type="email" label="Email" value={staffForm.emailId} onChange={(event) => setStaffForm({ ...staffForm, emailId: event.target.value })} />
        <TextField label="Phone number" value={staffForm.phoneNumber} onChange={(event) => setStaffForm({ ...staffForm, phoneNumber: event.target.value })} />
        <TextField required label="Designation" value={staffForm.designation} onChange={(event) => setStaffForm({ ...staffForm, designation: event.target.value })} />
        <TextField required select label="Branch role" value={staffForm.roleId} onChange={(event) => setStaffForm({ ...staffForm, roleId: event.target.value })}>
          {branchRoles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
        </TextField>
        <TextField required type="date" label="Joining date" InputLabelProps={{ shrink: true }} value={staffForm.joiningDate} onChange={(event) => setStaffForm({ ...staffForm, joiningDate: event.target.value })} />
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => setAddDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void addStaff()} disabled={saving || !staffForm.firstName.trim() || !staffForm.lastName.trim() || !staffForm.emailId.trim() || !staffForm.designation.trim() || !staffForm.roleId}>Add staff</Button></DialogActions>
    </Dialog>
    <Snackbar open={Boolean(staffNotice)} autoHideDuration={3500} onClose={() => setStaffNotice("")} message={staffNotice} />
  </Box>;
}
