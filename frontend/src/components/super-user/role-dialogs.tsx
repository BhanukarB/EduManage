import type { Dispatch, SetStateAction } from "react";
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { Permission } from "@/types/domain";
import { permissionLabel } from "@/lib/formatters";

interface RolePermissions {
  roleId: string;
  role: string;
  permissions: Permission[];
}

interface RoleDialogsProps {
  createOpen: boolean;
  setCreateOpen: (open: boolean) => void;
  newRoleName: string;
  setNewRoleName: (name: string) => void;
  newRoleType: number;
  setNewRoleType: (type: number) => void;
  permissions: Permission[];
  newRolePermissionIds: string[];
  setNewRolePermissionIds: Dispatch<SetStateAction<string[]>>;
  selectedRole: RolePermissions | null;
  setSelectedRole: (role: RolePermissions | null) => void;
  checkedPermissionIds: string[];
  setCheckedPermissionIds: Dispatch<SetStateAction<string[]>>;
  rolePermissionSearch: string;
  setRolePermissionSearch: (search: string) => void;
  saving: boolean;
  error: string | null;
  onCreateRole: () => void;
  onSavePermissions: () => void;
}

function togglePermission(id: string, current: string[], update: Dispatch<SetStateAction<string[]>>): void {
  update(current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
}

export function RoleDialogs(props: RoleDialogsProps) {
  const filteredPermissions = props.permissions.filter((permission) => permission.permission.toLowerCase().includes(props.rolePermissionSearch.trim().toLowerCase()));
  const allPermissionIds = props.permissions.map((permission) => permission.id);
  const toggleAll = (current: string[], update: Dispatch<SetStateAction<string[]>>) => {
    update(current.length === allPermissionIds.length ? [] : allPermissionIds);
  };
  return <>
    <Dialog open={props.createOpen} onClose={() => !props.saving && props.setCreateOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>Create role</Typography><DialogContentText sx={{ mt: 0.5 }}>Set the role name, level, and permissions.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {props.error && <Alert severity="error" variant="filled" sx={{ mb: 1 }}>{props.error}</Alert>}
        <TextField autoFocus label="Role name" value={props.newRoleName} onChange={(event) => props.setNewRoleName(event.target.value)} fullWidth />
        <TextField select label="Role type" value={props.newRoleType} onChange={(event) => props.setNewRoleType(Number(event.target.value))} fullWidth>
          <MenuItem value={1}>Global</MenuItem><MenuItem value={2}>Organisation</MenuItem><MenuItem value={3}>Branch</MenuItem>
        </TextField>
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography fontWeight={600}>Permissions to assign</Typography><Button size="small" onClick={() => toggleAll(props.newRolePermissionIds, props.setNewRolePermissionIds)}>{props.newRolePermissionIds.length === allPermissionIds.length ? "Deselect all" : "Select all"}</Button></Stack>
        <Box sx={{ maxHeight: 360, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 1.5 }}>
          {props.permissions.map((permission) => <FormControlLabel key={permission.id} control={<Checkbox checked={props.newRolePermissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id, props.newRolePermissionIds, props.setNewRolePermissionIds)} />} label={permissionLabel(permission.permission)} sx={{ display: "flex", ml: 0 }} />)}
          {!props.permissions.length && <Typography color="text.secondary" sx={{ p: 1 }}>No permissions available.</Typography>}
        </Box>
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => props.setCreateOpen(false)} disabled={props.saving}>Cancel</Button><Button variant="contained" onClick={props.onCreateRole} disabled={props.saving || !props.newRoleName.trim()}>{props.saving ? "Creating…" : "Create role"}</Button></DialogActions>
    </Dialog>

    <Dialog open={Boolean(props.selectedRole)} onClose={() => !props.saving && props.setSelectedRole(null)} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>{props.selectedRole ? `Permissions for ${props.selectedRole.role}` : "Role permissions"}</Typography><DialogContentText sx={{ mt: 0.5 }}>Choose which actions this role can perform.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}>{props.selectedRole && <Stack spacing={1}>
        {props.error && <Alert severity="error" variant="filled" sx={{ mb: 1 }}>{props.error}</Alert>}
        <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="body2" color="text.secondary">{props.checkedPermissionIds.length} selected</Typography><Button size="small" onClick={() => toggleAll(props.checkedPermissionIds, props.setCheckedPermissionIds)}>{props.checkedPermissionIds.length === allPermissionIds.length ? "Deselect all" : "Select all"}</Button></Stack>
        <Box sx={{ maxHeight: 360, overflow: "auto", border: "1px solid", borderColor: "divider", borderRadius: "12px", p: 1.5 }}>
        <TextField label="Search permissions" placeholder="Type a permission name" value={props.rolePermissionSearch} onChange={(event) => props.setRolePermissionSearch(event.target.value)} fullWidth size="small" sx={{ mb: 1 }} />
        {filteredPermissions.map((permission) => <FormControlLabel key={permission.id} control={<Checkbox checked={props.checkedPermissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id, props.checkedPermissionIds, props.setCheckedPermissionIds)} />} label={permissionLabel(permission.permission)} sx={{ display: "flex", ml: 0 }} />)}
        {!props.permissions.length && <Typography color="text.secondary">No permissions available.</Typography>}
        {props.permissions.length > 0 && !filteredPermissions.length && <Typography color="text.secondary" sx={{ py: 1 }}>No matching permissions.</Typography>}
        </Box>
      </Stack>}</DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => props.setSelectedRole(null)} disabled={props.saving}>Close</Button><Button variant="contained" onClick={props.onSavePermissions} disabled={props.saving}>{props.saving ? "Saving…" : "Save mapping"}</Button></DialogActions>
    </Dialog>
  </>;
}
