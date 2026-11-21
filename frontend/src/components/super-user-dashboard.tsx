"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { SignOutButton } from "@/components/sign-out-button";
import { ProfileLink } from "@/components/profile-link";

type Role = { id: string; name: string; permission_count?: number };
type Permission = { id: string; permission: string };
type RolePermissions = { roleId: string; role: string; permissions: Permission[] };
type Organisation = { id: string; name: string; tagline?: string | null; type: number; emailId: string; phoneNumber?: string | null; address?: Record<string, unknown> | null; status: number };
type OrganisationForm = Pick<Organisation, "name" | "tagline" | "type" | "emailId" | "phoneNumber">;
type AdminUserForm = { firstName: string; lastName: string; emailId: string; phoneNumber: string };
type OrganisationAdmin = AdminUserForm & { id: string; orgId: string };

const sections = [
  { label: "Organisations", icon: <ApartmentOutlined /> },
  { label: "Role Manager", icon: <AdminPanelSettingsOutlined /> },
];
const roleTabs = ["Roles", "Permissions"];

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path}`, {
    ...init,
    cache: "no-store",
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message ?? "The request could not be completed.");
  return body as T;
}

export function SuperUserDashboard({ email }: { email?: string }) {
  const [activeSection, setActiveSection] = useState("Organisations");
  const [activeRoleTab, setActiveRoleTab] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null);
  const [checkedPermissionIds, setCheckedPermissionIds] = useState<string[]>([]);
  const [rolePermissionSearch, setRolePermissionSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([]);
  const [organisationDialog, setOrganisationDialog] = useState<"create" | "edit" | null>(null);
  const [editingOrganisation, setEditingOrganisation] = useState<Organisation | null>(null);
  const [organisationForm, setOrganisationForm] = useState<OrganisationForm>({ name: "", tagline: "", type: 1, emailId: "", phoneNumber: "" });
  const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null);
  const [organisationDetailsOpen, setOrganisationDetailsOpen] = useState(false);
  const [organisationAdmins, setOrganisationAdmins] = useState<OrganisationAdmin[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminUserDialogOpen, setAdminUserDialogOpen] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<OrganisationAdmin | null>(null);
  const [adminUserForm, setAdminUserForm] = useState<AdminUserForm>({ firstName: "", lastName: "", emailId: "", phoneNumber: "" });

  const loadManagerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleList, permissionList] = await Promise.all([
        api<Role[]>("rbac/roles"),
        api<Permission[]>("rbac/permissions"),
      ]);
      setRoles(roleList);
      setPermissions(permissionList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load role manager data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOrganisations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrganisations(await api<Organisation[]>("organisations"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load organisations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "Role Manager") void loadManagerData();
    else void loadOrganisations();
  }, [activeSection, loadManagerData, loadOrganisations]);

  const openRole = async (role: Role) => {
    setError(null);
    setNotice(null);
    setRolePermissionSearch("");
    try {
      const details = await api<RolePermissions>(`rbac/roles/${role.id}/permissions`);
      setSelectedRole(details);
      setCheckedPermissionIds(details.permissions.map((permission) => permission.id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load role permissions.");
    }
  };

  const togglePermission = (id: string, current: string[], update: (ids: string[]) => void) => {
    update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    setError(null);
    try {
      await api<void>(`rbac/roles/${selectedRole.roleId}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissionIds: checkedPermissionIds }),
      });
      const updated = permissions.filter((permission) => checkedPermissionIds.includes(permission.id));
      setSelectedRole({ ...selectedRole, permissions: updated });
      setRoles((current) => current.map((role) => role.id === selectedRole.roleId
        ? { ...role, permission_count: updated.length }
        : role));
      setNotice("Role permissions updated.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update role permissions.");
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    setSaving(true);
    setError(null);
    try {
      const role = await api<Role>("rbac/roles", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (newRolePermissionIds.length) {
        await api<void>(`rbac/roles/${role.id}/permissions`, {
          method: "POST",
          body: JSON.stringify({ permissionIds: newRolePermissionIds }),
        });
      }
      setCreateOpen(false);
      setNewRoleName("");
      setNewRolePermissionIds([]);
      setNotice(`Role “${name}” created.`);
      await loadManagerData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create role.");
    } finally {
      setSaving(false);
    }
  };

  const openOrganisationDialog = (mode: "create" | "edit", organisation?: Organisation) => {
    setError(null);
    setNotice(null);
    setEditingOrganisation(organisation ?? null);
    setOrganisationForm(organisation ? {
      name: organisation.name,
      tagline: organisation.tagline ?? "",
      type: organisation.type,
      emailId: organisation.emailId,
      phoneNumber: organisation.phoneNumber ?? "",
    } : { name: "", tagline: "", type: 1, emailId: "", phoneNumber: "" });
    setOrganisationDialog(mode);
  };

  const saveOrganisation = async () => {
    setSaving(true);
    setError(null);
    const editing = organisationDialog === "edit" && editingOrganisation;
    try {
      const saved = await api<Organisation>(editing ? `organisations/update/${editing.id}` : "organisations/create", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({ ...organisationForm, tagline: organisationForm.tagline || null, phoneNumber: organisationForm.phoneNumber || null }),
      });
      setOrganisations((current) => editing
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      setOrganisationDialog(null);
      setNotice(editing ? `“${saved.name}” updated.` : `“${saved.name}” created.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the organisation.");
    } finally {
      setSaving(false);
    }
  };

  const openOrganisationDetails = async (organisation: Organisation) => {
    setError(null);
    setNotice(null);
    setSelectedOrganisation(organisation);
    setOrganisationAdmins([]);
    setOrganisationDetailsOpen(true);
    setAdminsLoading(true);
    try {
      setOrganisationAdmins(await api<OrganisationAdmin[]>(`organisations/${organisation.id}/org-admins`));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load organisation admins.");
    } finally {
      setAdminsLoading(false);
    }
  };

  const openAdminUserDialog = async () => {
    if (!selectedOrganisation) return;
    const existingAdmin = organisationAdmins[0] ?? null;
    setEditingAdminUser(existingAdmin);
    setAdminUserForm(existingAdmin ? {
      firstName: existingAdmin.firstName,
      lastName: existingAdmin.lastName,
      emailId: existingAdmin.emailId,
      phoneNumber: existingAdmin.phoneNumber ?? "",
    } : { firstName: "", lastName: "", emailId: "", phoneNumber: "" });
    setError(null);
    setAdminUserDialogOpen(true);
    if (!existingAdmin) {
      try {
        setRoles(await api<Role[]>("rbac/roles"));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load roles.");
      }
    }
  };

  const saveOrganisationAdmin = async () => {
    if (!selectedOrganisation) return;
    setSaving(true);
    setError(null);
    try {
      if (editingAdminUser) {
        const updated = await api<OrganisationAdmin>(`users/${editingAdminUser.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ...adminUserForm, phoneNumber: adminUserForm.phoneNumber || null }),
        });
        setOrganisationAdmins((current) => current.map((admin) => admin.id === updated.id ? updated : admin));
        setNotice(`Org admin ${updated.emailId} updated.`);
      } else {
        const organisationAdminRole = roles.find((role) => role.name.toLowerCase() === "org_admin");
        if (!organisationAdminRole) throw new Error("The org_admin role is not configured.");
        const created = await api<OrganisationAdmin>("users", {
          method: "POST",
          body: JSON.stringify({ ...adminUserForm, phoneNumber: adminUserForm.phoneNumber || null, orgId: selectedOrganisation.id }),
        });
        await api<void>(`rbac/organisations/${selectedOrganisation.id}/users/${created.id}/roles`, {
          method: "POST",
          body: JSON.stringify({ roleIds: [organisationAdminRole.id] }),
        });
        setOrganisationAdmins((current) => [...current, created]);
        setNotice(`Org admin ${created.emailId} added to ${selectedOrganisation.name}.`);
      }
      setAdminUserDialogOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save the org admin.");
    } finally {
      setSaving(false);
    }
  };

  const renderPermissionList = (items: Permission[]) => (
    items.length ? (
      <List disablePadding>
        {items.map((permission) => (
          <ListItemText
            key={permission.id}
            primary={permission.permission}
            sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }}
          />
        ))}
      </List>
    ) : <Typography color="text.secondary" sx={{ p: 2 }}>No permissions found.</Typography>
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#f6f7fb" }}>
      <Box component="aside" sx={{ width: { xs: 220, sm: 260 }, flexShrink: 0, bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", px: 2, py: 3 }}>
        <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2} sx={{ px: 1.5, mb: 3 }}>CLASSMANAGE</Typography>
        <List disablePadding>
          {sections.map((section) => (
            <ListItemButton key={section.label} selected={activeSection === section.label} onClick={() => setActiveSection(section.label)} sx={{ borderRadius: 2, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>{section.icon}</ListItemIcon>
              <ListItemText primary={section.label} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ mb: 1.5 }} />
        <SignOutButton />
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 3, md: 6 } }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>{activeSection}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Manage {activeSection.toLowerCase()} across ClassManage.</Typography>
            </Box>
            <ProfileLink email={email} />
          </Box>

          {activeSection === "Role Manager" ? (
            <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", minHeight: 360, overflow: "hidden" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, px: { xs: 2, md: 3 }, pt: 2 }}>
                <Tabs value={activeRoleTab} onChange={(_, value: number) => setActiveRoleTab(value)} aria-label="Role manager sections" variant="scrollable" scrollButtons="auto">
                  {roleTabs.map((tab) => <Tab key={tab} label={tab} />)}
                </Tabs>
                {activeRoleTab === 0 && <Button variant="contained" startIcon={<AddOutlined />} onClick={() => setCreateOpen(true)}>Create role</Button>}
              </Box>
              <Divider />
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
                {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box> : (
                  <>
                    {activeRoleTab === 0 && (roles.length ? (
                      <List disablePadding>
                        {roles.map((role) => (
                          <ListItemButton key={role.id} onClick={() => void openRole(role)} sx={{ px: 2, py: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 1 }}>
                            <ListItemText primary={role.name} secondary={`${role.permission_count ?? 0} permissions`} />
                            <Typography color="primary.main" variant="body2">View and edit</Typography>
                          </ListItemButton>
                        ))}
                      </List>
                    ) : <Typography color="text.secondary">No roles found.</Typography>)}
                    {activeRoleTab === 1 && renderPermissionList(permissions)}
                  </>
                )}
              </Box>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, border: "1px solid", borderColor: "divider", minHeight: 220 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
                <Typography variant="h6" fontWeight={600}>Organisations</Typography>
                <Button variant="contained" startIcon={<AddOutlined />} onClick={() => openOrganisationDialog("create")}>Create organisation</Button>
              </Stack>
              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
              {notice && <Alert severity="success" sx={{ mt: 2 }} onClose={() => setNotice(null)}>{notice}</Alert>}
              {loading ? <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box> : (
                organisations.length ? <List disablePadding sx={{ mt: 2 }}>
                  {organisations.map((organisation) => (
                    <ListItemButton key={organisation.id} onClick={() => void openOrganisationDetails(organisation)} sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 1 }}>
                      <ListItemText primary={organisation.name} secondary={[organisation.emailId, organisation.phoneNumber, organisation.tagline].filter(Boolean).join(" · ")} />
                      <Typography color="text.secondary" variant="body2" sx={{ whiteSpace: "nowrap" }}>{organisation.type === 1 ? "School" : organisation.type === 2 ? "Coaching" : `Type ${organisation.type}`}</Typography>
                    </ListItemButton>
                  ))}
                </List> : !error && <Typography color="text.secondary" sx={{ mt: 1 }}>No organisations found.</Typography>
              )}
            </Paper>
          )}
        </Stack>
      </Box>

      <Dialog open={createOpen} onClose={() => !saving && setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create role</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField autoFocus label="Role name" value={newRoleName} onChange={(event) => setNewRoleName(event.target.value)} fullWidth />
            <Typography fontWeight={600}>Permissions to assign</Typography>
            <Box sx={{ maxHeight: 300, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1 }}>
              {permissions.map((permission) => (
                <FormControlLabel key={permission.id} control={<Checkbox checked={newRolePermissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id, newRolePermissionIds, setNewRolePermissionIds)} />} label={permission.permission} sx={{ display: "flex", ml: 0 }} />
              ))}
              {!permissions.length && <Typography color="text.secondary" sx={{ p: 1 }}>No permissions available.</Typography>}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void createRole()} disabled={saving || !newRoleName.trim()}>{saving ? "Creating…" : "Create role"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(organisationDialog)} onClose={() => !saving && setOrganisationDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>{organisationDialog === "edit" ? "Edit organisation" : "Create organisation"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField required label="Organisation name" value={organisationForm.name} onChange={(event) => setOrganisationForm({ ...organisationForm, name: event.target.value })} />
            <TextField label="Tagline" value={organisationForm.tagline ?? ""} onChange={(event) => setOrganisationForm({ ...organisationForm, tagline: event.target.value })} />
            <TextField select label="Organisation type" value={organisationForm.type} onChange={(event) => setOrganisationForm({ ...organisationForm, type: Number(event.target.value) })}>
              <MenuItem value={1}>School</MenuItem>
              <MenuItem value={2}>Coaching</MenuItem>
            </TextField>
            <TextField required type="email" label="Email" value={organisationForm.emailId} onChange={(event) => setOrganisationForm({ ...organisationForm, emailId: event.target.value })} />
            <TextField label="Phone number" value={organisationForm.phoneNumber ?? ""} onChange={(event) => setOrganisationForm({ ...organisationForm, phoneNumber: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrganisationDialog(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveOrganisation()} disabled={saving || !organisationForm.name.trim() || !organisationForm.emailId.trim()}>{saving ? "Saving…" : "Save organisation"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={organisationDetailsOpen} onClose={() => setOrganisationDetailsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedOrganisation?.name ?? "Organisation details"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {selectedOrganisation && <>
              <Typography><strong>Type:</strong> {selectedOrganisation.type === 1 ? "School" : selectedOrganisation.type === 2 ? "Coaching" : `Type ${selectedOrganisation.type}`}</Typography>
              <Typography><strong>Email:</strong> {selectedOrganisation.emailId}</Typography>
              {selectedOrganisation.phoneNumber && <Typography><strong>Phone:</strong> {selectedOrganisation.phoneNumber}</Typography>}
              {selectedOrganisation.tagline && <Typography><strong>Tagline:</strong> {selectedOrganisation.tagline}</Typography>}
              {selectedOrganisation.address && <Typography><strong>Address:</strong> {Object.values(selectedOrganisation.address).filter(Boolean).join(", ")}</Typography>}
              <Divider />
              <Typography variant="subtitle1" fontWeight={600}>Organisation admins</Typography>
            </>}
            {error && <Alert severity="error">{error}</Alert>}
            {adminsLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box> : organisationAdmins.length ? organisationAdmins.map((admin) => (
              <Typography key={admin.id}>{admin.firstName} {admin.lastName} · {admin.emailId}</Typography>
            )) : !error && <Typography color="text.secondary">No org_admin users assigned.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<EditOutlined />} onClick={() => { if (selectedOrganisation) { setOrganisationDetailsOpen(false); openOrganisationDialog("edit", selectedOrganisation); } }}>Edit organisation</Button>
          <Button onClick={() => setOrganisationDetailsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => void openAdminUserDialog()} disabled={adminsLoading}>{organisationAdmins.length ? "Update org_admin" : "Add org_admin"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={adminUserDialogOpen} onClose={() => !saving && setAdminUserDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingAdminUser ? "Update org_admin" : "Add org_admin"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Typography color="text.secondary">{selectedOrganisation?.name}</Typography>
            <TextField required label="First name" value={adminUserForm.firstName} onChange={(event) => setAdminUserForm({ ...adminUserForm, firstName: event.target.value })} />
            <TextField required label="Last name" value={adminUserForm.lastName} onChange={(event) => setAdminUserForm({ ...adminUserForm, lastName: event.target.value })} />
            <TextField required type="email" label="Email" value={adminUserForm.emailId} onChange={(event) => setAdminUserForm({ ...adminUserForm, emailId: event.target.value })} />
            <TextField label="Phone number" value={adminUserForm.phoneNumber} onChange={(event) => setAdminUserForm({ ...adminUserForm, phoneNumber: event.target.value })} />
            {!editingAdminUser && <Typography variant="caption" color="text.secondary">The account is created with the system’s default password.</Typography>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdminUserDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveOrganisationAdmin()} disabled={saving || !adminUserForm.firstName.trim() || !adminUserForm.lastName.trim() || !adminUserForm.emailId.trim()}>{saving ? "Saving…" : editingAdminUser ? "Update org_admin" : "Add org_admin"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedRole)} onClose={() => !saving && setSelectedRole(null)} fullWidth maxWidth="sm">
        <DialogTitle>{selectedRole ? `Permissions for ${selectedRole.role}` : "Role permissions"}</DialogTitle>
        <DialogContent dividers>
          {selectedRole && <Stack spacing={0.5}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Search permissions"
              placeholder="Type a permission name"
              value={rolePermissionSearch}
              onChange={(event) => setRolePermissionSearch(event.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            {permissions.filter((permission) => permission.permission.toLowerCase().includes(rolePermissionSearch.trim().toLowerCase())).map((permission) => (
              <FormControlLabel key={permission.id} control={<Checkbox checked={checkedPermissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id, checkedPermissionIds, setCheckedPermissionIds)} />} label={permission.permission} />
            ))}
            {!permissions.length && <Typography color="text.secondary">No permissions available.</Typography>}
            {permissions.length > 0 && !permissions.some((permission) => permission.permission.toLowerCase().includes(rolePermissionSearch.trim().toLowerCase())) && (
              <Typography color="text.secondary" sx={{ py: 1 }}>No matching permissions.</Typography>
            )}
          </Stack>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedRole(null)} disabled={saving}>Close</Button>
          <Button variant="contained" onClick={() => void saveRolePermissions()} disabled={saving}>{saving ? "Saving…" : "Save mapping"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
