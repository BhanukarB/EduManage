"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Stack } from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { ProfileLink } from "@/components/profile-link";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { api, extractErrorMessage, readApi } from "@/lib/api";
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
  const [sectionLoad, setSectionLoad] = useState<{ section: string; loading: boolean; error: string | null }>({
    section: "Organisations", loading: true, error: null,
  });
  const loading = sectionLoad.section !== activeSection || sectionLoad.loading;
  const roleRequest = useRef(0);
  const adminsRequest = useRef(0);
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

  useEffect(() => {
    let active = true;
    const load = async (): Promise<void> => {
      if (!active) return;
      setSectionLoad({ section: activeSection, loading: true, error: null });
      try {
        if (activeSection === "Role Manager") {
          const [roleList, permissionList] = await Promise.all([
            readApi<Role[]>("rbac/roles", 60_000),
            readApi<Permission[]>("rbac/permissions", 60_000),
          ]);
          if (active) {
            setRoles(roleList);
            setPermissions(permissionList);
          }
        } else {
          const list = await readApi<Organisation[]>("organisations", 60_000);
          if (active) setOrganisations(list);
        }
        if (active) setSectionLoad({ section: activeSection, loading: false, error: null });
      } catch (reason) {
        if (active) setSectionLoad({ section: activeSection, loading: false, error: extractErrorMessage(reason, "Could not load this section.") });
      }
    };
    void Promise.resolve().then(load);
    return () => { active = false; };
  }, [activeSection]);

  const sectionError = error ?? (sectionLoad.section === activeSection ? sectionLoad.error : null);

  const openRole = async (role: Role) => {
    const request = ++roleRequest.current;
    setError(null);
    setNotice(null);
    setRolePermissionSearch("");
    try {
      const details = await api<RolePermissions>(`rbac/roles/${role.id}/permissions`);
      if (request !== roleRequest.current) return;
      setSelectedRole(details);
      setCheckedPermissionIds(details.permissions.map((permission) => permission.id));
    } catch (reason) {
      if (request === roleRequest.current) setError(extractErrorMessage(reason, "Could not load role permissions."));
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
      }, ["rbac/roles"]);
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
      }, ["rbac/roles"]);
      if (newRolePermissionIds.length) {
        await api<void>(`rbac/roles/${role.id}/permissions`, {
          method: "POST",
          body: JSON.stringify({ permissionIds: newRolePermissionIds }),
        }, ["rbac/roles"]);
      }
      setCreateOpen(false);
      setNewRoleName("");
      setNewRoleType(2);
      setNewRolePermissionIds([]);
      setNotice(`Role “${name}” created.`);
      setRoles(await readApi<Role[]>("rbac/roles", 60_000));
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
    const request = ++adminsRequest.current;
    setError(null);
    setNotice(null);
    setSelectedOrganisation(organisation);
    setOrganisationAdmins([]);
    setOrganisationDetailsOpen(true);
    setAdminsLoading(true);
    try {
      const admins = await api<OrganisationAdmin[]>(`organisations/${organisation.id}/org-admins`);
      if (request === adminsRequest.current) setOrganisationAdmins(admins);
    } catch (reason) {
      if (request === adminsRequest.current) setError(extractErrorMessage(reason, "Could not load organisation admins."));
    } finally {
      if (request === adminsRequest.current) setAdminsLoading(false);
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
        setRoles(await readApi<Role[]>("rbac/roles", 60_000));
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
      <DashboardSidebar items={sections} active={activeSection} onNavigate={(section) => { setError(null); setNotice(null); setActiveSection(section); }} email={email} />

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, maxWidth: 1360, mx: "auto", p: { xs: 3, md: 5 } }}>
        <Stack spacing={3}>
          <PageHeader title={activeSection} subtitle={`Manage ${activeSection.toLowerCase()} across ClassManage.`} action={<ProfileLink email={email} />} compactSpacing />

          {activeSection === "Role Manager" ? (
            <RoleManagerSection
              roles={roles}
              permissions={permissions}
              loading={loading}
              error={sectionError}
              notice={notice}
              activeTab={activeRoleTab}
              onTabChange={setActiveRoleTab}
              onCreateRole={() => setCreateOpen(true)}
              onOpenRole={(role) => void openRole(role)}
              onDismissError={() => { setError(null); setSectionLoad((current) => ({ ...current, error: null })); }}
              onDismissNotice={() => setNotice(null)}
            />
          ) : (
            <OrganisationSection
              organisations={organisations}
              loading={loading}
              error={sectionError}
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
