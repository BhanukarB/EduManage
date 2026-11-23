"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { ProfileLink } from "@/components/profile-link";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { api, extractErrorMessage } from "@/lib/api";
import type { Organisation, Permission, Role } from "@/types/domain";
import { RoleManagerSection } from "@/components/super-user/role-manager-section";
import { OrganisationSection } from "@/components/super-user/organisation-section";
import { RoleDialogs } from "@/components/super-user/role-dialogs";
import { OrganisationDialogs } from "@/components/super-user/organisation-dialogs";
import type { AdminUserForm, OrganisationAdmin, OrganisationForm } from "@/components/super-user/organisation-dialogs";
import { PageHeader } from "@/components/common/page-header";

type RolePermissions = { roleId: string; role: string; permissions: Permission[] };

const sections = [
  { label: "Organisations", icon: <ApartmentOutlined /> },
  { label: "Role Manager", icon: <AdminPanelSettingsOutlined /> },
];

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
  const [newRoleType, setNewRoleType] = useState(2);
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
      setError(extractErrorMessage(reason, "Could not load role manager data."));
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
      setError(extractErrorMessage(reason, "Could not load organisations."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = Promise.resolve().then(() => {
      if (activeSection === "Role Manager") return loadManagerData();
      return loadOrganisations();
    });
    void task;
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
      setError(extractErrorMessage(reason, "Could not load role permissions."));
    }
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
      setError(extractErrorMessage(reason, "Could not update role permissions."));
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
        body: JSON.stringify({ name, roleType: newRoleType }),
      });
      if (newRolePermissionIds.length) {
        await api<void>(`rbac/roles/${role.id}/permissions`, {
          method: "POST",
          body: JSON.stringify({ permissionIds: newRolePermissionIds }),
        });
      }
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleType(2);
      setNewRolePermissionIds([]);
      setNotice(`Role “${name}” created.`);
      await loadManagerData();
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not create role."));
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
      setError(extractErrorMessage(reason, "Could not save the organisation."));
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
      setError(extractErrorMessage(reason, "Could not load organisation admins."));
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
        setError(extractErrorMessage(reason, "Could not load roles."));
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
      setError(extractErrorMessage(reason, "Could not save the org admin."));
    } finally {
      setSaving(false);
    }
  };


  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <DashboardSidebar items={sections} active={activeSection} onNavigate={setActiveSection} email={email} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, maxWidth: 1360, mx: "auto", p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <PageHeader title={activeSection} subtitle={`Manage ${activeSection.toLowerCase()} across ClassManage.`} action={<ProfileLink email={email} />} compactSpacing />

          {activeSection === "Role Manager" ? (
            <RoleManagerSection
              roles={roles}
              permissions={permissions}
              loading={loading}
              error={error}
              notice={notice}
              activeTab={activeRoleTab}
              onTabChange={setActiveRoleTab}
              onCreateRole={() => setCreateOpen(true)}
              onOpenRole={(role) => void openRole(role)}
              onDismissError={() => setError(null)}
              onDismissNotice={() => setNotice(null)}
            />
          ) : (
            <OrganisationSection
              organisations={organisations}
              loading={loading}
              error={error}
              notice={notice}
              onCreate={() => openOrganisationDialog("create")}
              onOpen={(organisation) => void openOrganisationDetails(organisation)}
              onDismissNotice={() => setNotice(null)}
            />
          )}
        </Stack>
      </Box>

      <RoleDialogs
        createOpen={createOpen}
        setCreateOpen={setCreateOpen}
        newRoleName={newRoleName}
        setNewRoleName={setNewRoleName}
        newRoleType={newRoleType}
        setNewRoleType={setNewRoleType}
        permissions={permissions}
        newRolePermissionIds={newRolePermissionIds}
        setNewRolePermissionIds={setNewRolePermissionIds}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        checkedPermissionIds={checkedPermissionIds}
        setCheckedPermissionIds={setCheckedPermissionIds}
        rolePermissionSearch={rolePermissionSearch}
        setRolePermissionSearch={setRolePermissionSearch}
        saving={saving}
        error={error}
        onCreateRole={() => void createRole()}
        onSavePermissions={() => void saveRolePermissions()}
      />
      <OrganisationDialogs
        mode={organisationDialog}
        setMode={setOrganisationDialog}
        form={organisationForm}
        setForm={setOrganisationForm}
        selected={selectedOrganisation}
        detailsOpen={organisationDetailsOpen}
        setDetailsOpen={setOrganisationDetailsOpen}
        admins={organisationAdmins}
        adminsLoading={adminsLoading}
        adminOpen={adminUserDialogOpen}
        setAdminOpen={setAdminUserDialogOpen}
        editingAdmin={editingAdminUser}
        adminForm={adminUserForm}
        setAdminForm={setAdminUserForm}
        saving={saving}
        error={error}
        onSaveOrganisation={() => void saveOrganisation()}
        onEditOrganisation={(organisation) => { setOrganisationDetailsOpen(false); openOrganisationDialog("edit", organisation); }}
        onOpenAdmin={() => void openAdminUserDialog()}
        onSaveAdmin={() => void saveOrganisationAdmin()}
      />
    </Box>
  );
}
