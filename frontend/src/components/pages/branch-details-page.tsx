"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Divider, List, ListItem, ListItemText, Paper, Stack, Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel } from "@mui/material";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";

type BranchSummary = {
  branch: { branchName: string; branchCode: string; emailId: string; phoneNumber?: string | null; status: number };
  staffCount: number;
  studentCount: number;
  classes: { id: string; className: string; classCode: string }[];
};
type Staff = { id: string; userId: string; firstName: string; lastName: string; emailId: string; phoneNumber?: string | null; branchId: string | null; designation: string; status: number };
type Branch = { id: string; branchName: string };
type Role = { id: string; name: string; roleType: number | null };

export function BranchDetailsPage({ orgId, branchId }: { orgId: string; branchId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchRoles, setBranchRoles] = useState<Role[]>([]);
  const [staffView, setStaffView] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [staffForm, setStaffForm] = useState({ firstName: "", lastName: "", emailId: "", phoneNumber: "", designation: "", joiningDate: new Date().toISOString().slice(0, 10), roleId: "" });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/backend/organisations/${orgId}/branches/${branchId}/summary`, { cache: "no-store" }),
      fetch(`/api/backend/organisations/${orgId}/staff`, { cache: "no-store" }),
      fetch(`/api/backend/organisations/${orgId}/branches`, { cache: "no-store" }),
      fetch("/api/backend/rbac/branch-roles", { cache: "no-store" }),
    ]).then(async ([summaryResponse, staffResponse, branchesResponse, rolesResponse]) => {
      const [summaryBody, staffBody, branchesBody, rolesBody] = await Promise.all([
        summaryResponse.json().catch(() => null), staffResponse.json().catch(() => null), branchesResponse.json().catch(() => null), rolesResponse.json().catch(() => null),
      ]);
      if (!summaryResponse.ok) throw new Error(summaryBody?.message ?? "Could not load branch details.");
      if (!staffResponse.ok) throw new Error(staffBody?.message ?? "Could not load staff.");
      if (!branchesResponse.ok) throw new Error(branchesBody?.message ?? "Could not load branches.");
      if (!rolesResponse.ok) throw new Error(rolesBody?.message ?? "Could not load branch roles.");
      return { summary: summaryBody as BranchSummary, staff: staffBody as Staff[], branches: branchesBody as Branch[], roles: rolesBody as Role[] };
    }).then((data) => { if (active) { setSummary(data.summary); setStaff(data.staff.filter((person) => person.branchId === branchId)); setBranches(data.branches); setBranchRoles(data.roles); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load branch details."); });
    return () => { active = false; };
  }, [orgId, branchId]);

  const updateStaff = async (person: Staff, changes: Partial<Pick<Staff, "status" | "designation" | "branchId">>) => {
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/backend/organisations/staff/update", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ orgId, staffId: person.id, ...changes }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Could not update staff.");
      const updated = body as Staff;
      setStaff((current) => current.map((item) => item.id === person.id ? updated : item).filter((item) => item.branchId === branchId));
      if (person.branchId === branchId && updated.branchId !== branchId) {
        setSummary((current) => current ? { ...current, staffCount: Math.max(0, current.staffCount - 1) } : current);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not update staff."); }
    finally { setSaving(false); }
  };

  const addStaff = async () => {
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/backend/organisations/staff/add", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...staffForm, orgId, branchId, phoneNumber: staffForm.phoneNumber || null }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? "Could not add staff.");
      setStaff((current) => [...current, body as Staff]);
      setSummary((current) => current ? { ...current, staffCount: current.staffCount + 1 } : current);
      setAddDialogOpen(false);
      setStaffForm({ firstName: "", lastName: "", emailId: "", phoneNumber: "", designation: "", joiningDate: new Date().toISOString().slice(0, 10), roleId: "" });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not add staff."); }
    finally { setSaving(false); }
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fb", p: { xs: 2, md: 4 } }}>
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push("/dashboard")}>Back to branches</Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {!summary && !error ? <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box> : summary && <>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mt: 2, mb: 3 }}>
          <Box><Typography variant="h4" component="h1" fontWeight={750}>{summary.branch.branchName}</Typography><Typography color="text.secondary">Branch code: {summary.branch.branchCode}</Typography></Box>
          <Typography color={summary.branch.status === 1 ? "success.dark" : "text.secondary"} fontWeight={700}>{summary.branch.status === 1 ? "Active" : "Inactive"}</Typography>
        </Stack>
        {!staffView ? <><Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Staff", count: summary.staffCount, icon: <GroupsOutlined color="primary" /> },
            { label: "Students", count: summary.studentCount, icon: <SchoolOutlined color="primary" /> },
            { label: "Classes", count: summary.classes.length, icon: <ApartmentOutlined color="primary" /> },
          ].map((item) => item.label === "Staff" ? <Paper key={item.label} component="button" onClick={() => setStaffView(true)} variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1, textAlign: "left", bgcolor: "background.paper", cursor: "pointer", "&:hover": { borderColor: "primary.main" } }}><Stack direction="row" spacing={1.5} alignItems="center">{item.icon}<Box><Typography color="text.secondary">{item.label}</Typography><Typography variant="h4" fontWeight={700}>{item.count}</Typography></Box></Stack></Paper> : <Paper key={item.label} variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1 }}><Stack direction="row" spacing={1.5} alignItems="center">{item.icon}<Box><Typography color="text.secondary">{item.label}</Typography><Typography variant="h4" fontWeight={700}>{item.count}</Typography></Box></Stack></Paper>)}
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Branch information</Typography><Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={4}><Box><Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography>{summary.branch.emailId}</Typography></Box><Box><Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{summary.branch.phoneNumber || "Not provided"}</Typography></Box></Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>Classes</Typography>
          {summary.classes.length ? <List>{summary.classes.map((item) => <ListItem key={item.id} divider><ListItemText primary={item.className} secondary={`Class code: ${item.classCode}`} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No classes are linked to this branch yet.</Typography>}
        </Paper>
        </> : <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
            <Button startIcon={<ArrowBackOutlined />} onClick={() => setStaffView(false)}>Back to branch</Button>
            <Button variant="contained" onClick={() => setAddDialogOpen(true)}>Add staff</Button>
          </Stack>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700}>Staff at {summary.branch.branchName}</Typography>
            {staff.length ? <List disablePadding>{staff.map((person) => <ListItem key={person.id} divider sx={{ display: "block", py: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
                <ListItemText sx={{ flex: 1 }} primary={`${person.firstName} ${person.lastName}`} secondary={[person.emailId, person.phoneNumber].filter(Boolean).join(" · ")} />
                <TextField size="small" label="Designation" defaultValue={person.designation} onBlur={(event) => { if (event.target.value !== person.designation) void updateStaff(person, { designation: event.target.value }); }} sx={{ minWidth: 170 }} />
                <TextField select size="small" label="Branch" value={person.branchId ?? ""} onChange={(event) => void updateStaff(person, { branchId: event.target.value || null })} sx={{ minWidth: 190 }}>
                  <MenuItem value="">No branch</MenuItem>{branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.branchName}</MenuItem>)}
                </TextField>
                <FormControlLabel control={<Switch checked={person.status === 1} disabled={saving} onChange={(_, checked) => void updateStaff(person, { status: checked ? 1 : 0 })} />} label={person.status === 1 ? "Active" : "Inactive"} />
              </Stack>
            </ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No staff are assigned to this branch.</Typography>}
          </Paper>
        </>}
      </>}
    </Box>
    <Dialog open={addDialogOpen} onClose={() => !saving && setAddDialogOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Add staff to {summary?.branch.branchName}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
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
      <DialogActions><Button onClick={() => setAddDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void addStaff()} disabled={saving || !staffForm.firstName.trim() || !staffForm.lastName.trim() || !staffForm.emailId.trim() || !staffForm.designation.trim() || !staffForm.roleId}>Add staff</Button></DialogActions>
    </Dialog>
  </Box>;
}
