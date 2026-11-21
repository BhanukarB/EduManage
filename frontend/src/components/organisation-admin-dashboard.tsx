"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Button, CircularProgress, Divider, List, ListItem, ListItemButton, ListItemText, Paper,
  MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from "@mui/material";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { ProfileLink } from "@/components/profile-link";
import { SignOutButton } from "@/components/sign-out-button";

type Organisation = { id: string; name: string; tagline?: string | null; type: number; emailId: string; phoneNumber?: string | null; address?: Record<string, unknown> | null; status: number };
type Branch = { id: string; orgId: string; branchName: string; branchCode: string; type: number; emailId: string; phoneNumber?: string | null; address?: Record<string, unknown> | null; status: number };
type BranchForm = Pick<Branch, "branchName" | "branchCode" | "type" | "emailId"> & { phoneNumber: string };
type User = { id: string; firstName: string; lastName: string; emailId: string; phoneNumber?: string | null };

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, { ...init, cache: "no-store", headers: { "content-type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "Could not load organisation data.");
  return body as T;
}

export function OrganisationAdminDashboard({ email, orgId }: { email?: string; orgId: string }) {
  const router = useRouter();
  const [section, setSection] = useState(0);
  const [memberTab, setMemberTab] = useState(0);
  const [organisation, setOrganisation] = useState<Organisation | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<BranchForm>({ branchName: "", branchCode: "", type: 1, emailId: "", phoneNumber: "" });
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [savingBranch, setSavingBranch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      api<Organisation>(`organisations/get/${orgId}`),
      api<Branch[]>(`organisations/${orgId}/branches`),
      api<User[]>("users"),
    ]).then(([org, branchList, users]) => {
      if (!active) return;
      setOrganisation(org);
      setBranches(branchList);
      setStaff(users);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load organisation data.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orgId]);

  const navItems = [
    { label: "Dashboard", icon: <DashboardOutlined /> },
    { label: "Branches", icon: <ApartmentOutlined /> },
    { label: "Members", icon: <GroupsOutlined /> },
  ];

  const openBranch = (branch: Branch) => router.push(`/dashboard/branch/${branch.id}`);

  const createBranch = async () => {
    setSavingBranch(true);
    setError(null);
    try {
      const created = await api<Branch>(`organisations/${orgId}/branches/create`, {
        method: "POST",
        body: JSON.stringify({ ...branchForm, phoneNumber: branchForm.phoneNumber || null }),
      });
      setBranches((current) => [...current, created]);
      setBranchDialogOpen(false);
      setBranchForm({ branchName: "", branchCode: "", type: organisation?.type ?? 1, emailId: "", phoneNumber: "" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create branch.");
    } finally { setSavingBranch(false); }
  };

  const saveBranch = async () => {
    if (!selectedBranch) return;
    setSavingBranch(true);
    setError(null);
    try {
      const updated = await api<Branch>(`organisations/branches/update/${selectedBranch.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...branchForm, phoneNumber: branchForm.phoneNumber || null }),
      });
      setBranches((current) => current.map((branch) => branch.id === updated.id ? updated : branch));
      setSelectedBranch(updated);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update branch.");
    } finally { setSavingBranch(false); }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fb", display: "flex" }}>
      <Box component="aside" sx={{ width: { xs: 76, sm: 240 }, bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column" }}>
        <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1.5} sx={{ px: { xs: 0, sm: 1 }, textAlign: { xs: "center", sm: "left" }, mb: 3 }}>CLASSMANAGE</Typography>
        <Stack spacing={0.75}>
          {navItems.map((item, index) => <Box key={item.label} component="button" onClick={() => setSection(index)} aria-current={section === index ? "page" : undefined} sx={{ border: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 1.5, textAlign: "left", borderRadius: 2, px: { xs: 1, sm: 1.5 }, py: 1.25, color: section === index ? "primary.main" : "text.secondary", bgcolor: section === index ? "primary.50" : "transparent", font: "inherit", fontWeight: section === index ? 700 : 500, "&:hover": { bgcolor: "action.hover" } }}>{item.icon}<Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>{item.label}</Box></Box>)}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: { xs: "none", sm: "block" } }}><ProfileLink email={email} /><SignOutButton /></Box>
        <Box sx={{ display: { xs: "block", sm: "none" }, textAlign: "center" }}><SignOutButton /></Box>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box><Typography variant="h4" component="h1" fontWeight={750}>{navItems[section].label}</Typography><Typography color="text.secondary">{organisation?.name ?? "Your organisation"}</Typography></Box>
          <Box sx={{ display: { xs: "block", sm: "none" } }}><ProfileLink email={email} /></Box>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}><CircularProgress /></Box> : <>
          {section === 0 && <Stack spacing={2.5}>
            {organisation && <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 4 }, borderRadius: 3 }}>
              <Typography variant="overline" color="primary.main" fontWeight={700}>ORGANISATION OVERVIEW</Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>{organisation.name}</Typography>
              {organisation.tagline && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{organisation.tagline}</Typography>}
              <Divider sx={{ my: 2.5 }} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                <Box><Typography variant="caption" color="text.secondary">TYPE</Typography><Typography>{organisation.type === 1 ? "School" : organisation.type === 2 ? "Coaching" : `Type ${organisation.type}`}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography>{organisation.emailId}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{organisation.phoneNumber || "Not provided"}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">STATUS</Typography><Typography>{organisation.status === 1 ? "Active" : "Inactive"}</Typography></Box>
              </Stack>
            </Paper>}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              {[{ label: "Branches", count: branches.length }, { label: "Staff members", count: staff.length }].map((card) => <Paper key={card.label} variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1 }}><Typography color="text.secondary">{card.label}</Typography><Typography variant="h4" fontWeight={700}>{card.count}</Typography></Paper>)}
            </Stack>
          </Stack>}
          {section === 1 && <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
            {selectedBranch ? <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Button startIcon={<ArrowBackOutlined />} onClick={() => setSelectedBranch(null)}>Back to branches</Button>
                <Typography variant="body2" color="text.secondary">{selectedBranch.status === 1 ? "Active" : "Inactive"}</Typography>
              </Stack>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>{selectedBranch.branchName}</Typography>
              <Stack spacing={2} sx={{ maxWidth: 640 }}>
                <TextField required label="Branch name" value={branchForm.branchName} onChange={(event) => setBranchForm({ ...branchForm, branchName: event.target.value })} />
                <TextField required label="Branch code" value={branchForm.branchCode} onChange={(event) => setBranchForm({ ...branchForm, branchCode: event.target.value })} />
                <TextField select label="Branch type" value={branchForm.type} onChange={(event) => setBranchForm({ ...branchForm, type: Number(event.target.value) })}>
                  <MenuItem value={1}>School</MenuItem><MenuItem value={2}>Coaching</MenuItem>
                </TextField>
                <TextField required type="email" label="Email" value={branchForm.emailId} onChange={(event) => setBranchForm({ ...branchForm, emailId: event.target.value })} />
                <TextField label="Phone number" value={branchForm.phoneNumber} onChange={(event) => setBranchForm({ ...branchForm, phoneNumber: event.target.value })} />
                <Box><Button variant="contained" startIcon={<EditOutlined />} onClick={() => void saveBranch()} disabled={savingBranch || !branchForm.branchName.trim() || !branchForm.branchCode.trim() || !branchForm.emailId.trim()}>{savingBranch ? "Saving…" : "Save changes"}</Button></Box>
              </Stack>
            </> : <>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Box><Typography variant="h6" fontWeight={700}>Branches</Typography><Typography variant="body2" color="text.secondary">Manage locations in your organisation</Typography></Box>
                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => { setError(null); setBranchForm({ branchName: "", branchCode: "", type: organisation?.type ?? 1, emailId: "", phoneNumber: "" }); setBranchDialogOpen(true); }}>Add branch</Button>
              </Stack>
              {branches.length ? <List disablePadding sx={{ display: "grid", gap: 1.5, mt: 2 }}>{branches.map((branch) => <ListItem key={branch.id} disablePadding>
                <ListItemButton onClick={() => openBranch(branch)} sx={{ display: "block", p: { xs: 2, sm: 2.5 }, border: "1px solid", borderColor: "divider", borderRadius: 2, "&:hover": { borderColor: "primary.main" } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ overflowWrap: "anywhere" }}>{branch.branchName}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>Branch code: {branch.branchCode}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700} sx={{ flexShrink: 0, px: 1, py: 0.5, borderRadius: 5, color: branch.status === 1 ? "success.dark" : "text.secondary", bgcolor: branch.status === 1 ? "success.50" : "action.hover" }}>{branch.status === 1 ? "Active" : "Inactive"}</Typography>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.5fr) minmax(0, 1fr)" }, gap: { xs: 1, sm: 2 } }}>
                    <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" display="block">EMAIL</Typography><Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{branch.emailId}</Typography></Box>
                    <Box sx={{ minWidth: 0 }}><Typography variant="caption" color="text.secondary" display="block">PHONE</Typography><Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{branch.phoneNumber || "Not provided"}</Typography></Box>
                  </Box>
                </ListItemButton>
              </ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No branches have been added yet.</Typography>}
            </>}
          </Paper>}
          {section === 2 && <Paper variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Members</Typography>
            <Tabs value={memberTab} onChange={(_, value) => setMemberTab(value)} aria-label="Member categories"><Tab label="Staff" /><Tab label="Students" /></Tabs>
            {memberTab === 0 ? staff.length ? <List>{staff.map((user) => <ListItem key={user.id} divider><ListItemText primary={`${user.firstName} ${user.lastName}`} secondary={[user.emailId, user.phoneNumber].filter(Boolean).join(" · ")} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>No staff members found.</Typography> : <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>Student records will appear here.</Typography>}
          </Paper>}
        </>}
      </Box>
      {branchDialogOpen && <Box sx={{ position: "fixed", inset: 0, zIndex: 1300, bgcolor: "rgba(15, 23, 42, .45)", display: "grid", placeItems: "center", p: 2 }}>
        <Paper role="dialog" aria-modal="true" aria-labelledby="add-branch-title" sx={{ width: "100%", maxWidth: 520, p: 3, borderRadius: 3 }}>
          <Typography id="add-branch-title" variant="h6" fontWeight={700} sx={{ mb: 2 }}>Add branch</Typography>
          <Stack spacing={2}>
            <TextField required label="Branch name" value={branchForm.branchName} onChange={(event) => setBranchForm({ ...branchForm, branchName: event.target.value })} />
            <TextField required label="Branch code" value={branchForm.branchCode} onChange={(event) => setBranchForm({ ...branchForm, branchCode: event.target.value })} />
            <TextField select label="Branch type" value={branchForm.type} onChange={(event) => setBranchForm({ ...branchForm, type: Number(event.target.value) })}><MenuItem value={1}>School</MenuItem><MenuItem value={2}>Coaching</MenuItem></TextField>
            <TextField required type="email" label="Email" value={branchForm.emailId} onChange={(event) => setBranchForm({ ...branchForm, emailId: event.target.value })} />
            <TextField label="Phone number" value={branchForm.phoneNumber} onChange={(event) => setBranchForm({ ...branchForm, phoneNumber: event.target.value })} />
            <Stack direction="row" justifyContent="flex-end" spacing={1}><Button onClick={() => setBranchDialogOpen(false)} disabled={savingBranch}>Cancel</Button><Button variant="contained" onClick={() => void createBranch()} disabled={savingBranch || !branchForm.branchName.trim() || !branchForm.branchCode.trim() || !branchForm.emailId.trim()}>{savingBranch ? "Adding…" : "Add branch"}</Button></Stack>
          </Stack>
        </Paper>
      </Box>}
    </Box>
  );
}
