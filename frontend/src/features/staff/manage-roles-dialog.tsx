"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { api, extractErrorMessage } from "@/lib/api";
import type { Branch, Role, Staff } from "@/types/domain";

function fetchRoles(userId: string): Promise<[Role[], Role[]]> {
  return Promise.all([api<Role[]>(`rbac/users/${userId}/roles`), api<Role[]>("rbac/branch-roles")]);
}

function roleLabel(name: string): string {
  return name.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
}

export function ManageRolesDialog({ open, orgId, person, branches, onClose }: {
  open: boolean; orgId: string; person: Staff | null; branches: Branch[]; onClose: () => void;
}) {
  const [assignments, setAssignments] = useState<Role[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branchId, setBranchId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !person) return;
    let active = true;
    void fetchRoles(person.userId).then(([current, available]) => {
      if (active) { setAssignments(current); setRoles(available.filter(role => role.name !== "student")); setError(null); }
    }).catch(reason => { if (active) setError(extractErrorMessage(reason, "Could not load role assignments.")); });
    return () => { active = false; };
  }, [open, person]);
  const edit = async (assignmentRoleId: string, assignmentBranchId: string, method: "PUT" | "DELETE"): Promise<void> => {
    if (!person) return;
    try {
      if (method === "PUT") {
        await api("rbac/assignments", {
          method,
          body: JSON.stringify({ orgId, userId: person.userId, roleId: assignmentRoleId, branchId: assignmentBranchId }),
        });
      } else {
        await api(`rbac/organisations/${orgId}/users/${person.userId}/assignments/${assignmentRoleId}?branchId=${assignmentBranchId}`, { method });
      }
      const [current, available] = await fetchRoles(person.userId);
      setAssignments(current); setRoles(available.filter(role => role.name !== "student")); setError(null);
    } catch (reason) { setError(extractErrorMessage(reason, "Could not update the assignment.")); }
  };
  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
    <DialogTitle>Manage roles{person ? ` · ${person.firstName} ${person.lastName}` : ""}</DialogTitle>
    <DialogContent dividers><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Typography variant="subtitle1" fontWeight={700}>Branch assignments</Typography>
      <List disablePadding>{assignments.filter(item => item.branchId).map(item => {
        const branch = branches.find(value => value.id === item.branchId);
        return <ListItem key={`${item.id}-${item.branchId}`} disableGutters sx={{ gap: 1, flexWrap: "wrap" }}>
          <ListItemText primary={branch?.branchName ?? "Unknown branch"} secondary={roleLabel(item.name)} />
          <Button color="error" aria-label={`Remove ${roleLabel(item.name)} from ${branch?.branchName ?? "branch"}`}
            onClick={() => void edit(item.id, item.branchId!, "DELETE")}>Remove</Button>
        </ListItem>;
      })}</List>
      <Typography variant="subtitle1" fontWeight={700}>Add branch role</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField select label="Branch" value={branchId} onChange={event => setBranchId(event.target.value)} sx={{ flex: 1 }}>
          {branches.map(branch => <MenuItem key={branch.id} value={branch.id}>{branch.branchName}</MenuItem>)}
        </TextField>
        <TextField select label="Role" value={roleId} onChange={event => setRoleId(event.target.value)} sx={{ flex: 1 }}>
          {roles.map(role => <MenuItem key={role.id} value={role.id}>{role.name.replaceAll("_", " ")}</MenuItem>)}
        </TextField>
      </Stack>
      <Button variant="contained" disabled={!branchId || !roleId} onClick={() => void edit(roleId, branchId, "PUT")}>Add role</Button>
    </Stack></DialogContent>
    <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>;
}
