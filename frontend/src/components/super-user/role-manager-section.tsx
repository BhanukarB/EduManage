"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Divider, List, ListItemButton, ListItemText, Paper, Tab, Tabs, TextField, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import type { Permission, Role } from "@/types/domain";
import { permissionLabel } from "@/lib/formatters";

interface RoleManagerSectionProps {
  roles: Role[];
  permissions: Permission[];
  loading: boolean;
  error: string | null;
  notice: string | null;
  activeTab: number;
  onTabChange: (value: number) => void;
  onCreateRole: () => void;
  onOpenRole: (role: Role) => void;
  onDismissError: () => void;
  onDismissNotice: () => void;
}

export function RoleManagerSection({ roles, permissions, loading, error, notice, activeTab, onTabChange, onCreateRole, onOpenRole, onDismissError, onDismissNotice }: RoleManagerSectionProps) {
  const [search, setSearch] = useState("");
  const filteredRoles = useMemo(() => roles.filter((role) => role.name.toLowerCase().includes(search.trim().toLowerCase())), [roles, search]);
  return <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", minHeight: 360, overflow: "hidden" }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, px: { xs: 2, md: 3 }, py: 1, bgcolor: "grey.50" }}>
      <Tabs value={activeTab} onChange={(_, value: number) => onTabChange(value)} aria-label="Role manager sections" variant="scrollable" scrollButtons="auto">
        <Tab label="Roles" /><Tab label="Permissions" />
      </Tabs>
      {activeTab === 0 && <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreateRole}>Create role</Button>}
    </Box>
    <Divider />
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissError}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={onDismissNotice}>{notice}</Alert>}
      {loading ? <PanelLoading padding={6} /> : activeTab === 0 ? (
        roles.length ? <>
          <TextField size="small" fullWidth value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search roles…" inputProps={{ "aria-label": "Search roles" }} sx={{ mb: 2 }} />
          {filteredRoles.length ? <List disablePadding>{filteredRoles.map((role) => <ListItemButton key={role.id} onClick={() => onOpenRole(role)} sx={{ px: 2, py: 1.5, border: "1px solid", borderColor: "divider", borderRadius: "12px", mb: 1 }}>
            <ListItemText primary={role.name} />
            <Chip label={`${role.permission_count ?? 0} permissions`} size="small" sx={{ mr: 1 }} />
            <ChevronRightOutlined color="action" />
          </ListItemButton>)}</List> : <Typography color="text.secondary">No roles match “{search}”.</Typography>}
        </> : <Typography color="text.secondary">No roles found.</Typography>
      ) : permissions.length ? <List disablePadding>{permissions.map((permission) => <ListItemText key={permission.id} primary={permissionLabel(permission.permission)} sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider" }} />)}</List>
        : <Typography color="text.secondary" sx={{ p: 2 }}>No permissions found.</Typography>}
    </Box>
  </Paper>;
}
