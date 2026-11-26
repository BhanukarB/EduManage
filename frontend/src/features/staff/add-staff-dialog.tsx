"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Alert, Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { api, extractErrorMessage } from "@/lib/api";
import type { Role, Staff } from "@/types/domain";

export interface AddStaffForm {
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
  designation: string;
  joiningDate: string;
  roleId: string;
}

export interface ExistingStaffAssignment {
  userId: string;
  roleId: string;
}

interface AddStaffDialogProps {
  existingStaffOrgId?: string;
  branchId: string;
  open: boolean;
  branchName: string;
  branchRoles: Role[];
  rolesLoading: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (form: AddStaffForm | ExistingStaffAssignment) => Promise<boolean>;
}

function emptyStaffForm(): AddStaffForm {
  return {
    firstName: "",
    lastName: "",
    emailId: "",
    phoneNumber: "",
    designation: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    roleId: "",
  };
}

export function AddStaffDialog({ open, existingStaffOrgId, branchId, branchName, branchRoles, rolesLoading, saving, error, onClose, onSave }: AddStaffDialogProps): ReactNode {
  const [form, setForm] = useState(emptyStaffForm);

  const [existing, setExisting] = useState(Boolean(existingStaffOrgId));
  const [people, setPeople] = useState<Staff[] | null>(null);
  const [person, setPerson] = useState<Staff | null>(null);
  const [assignments, setAssignments] = useState<Role[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [existingRoleId, setExistingRoleId] = useState("");

  useEffect(() => {
    if (!existing || !existingStaffOrgId) return;
    let active = true;
    void api<Staff[]>(`organisations/${existingStaffOrgId}/staff`).then(rows => {
      if (active) setPeople(rows.filter(row => row.status === 1));
    }).catch(reason => {
      if (active) setLoadError(extractErrorMessage(reason, "Could not load organisation staff."));
    });
    return () => { active = false; };
  }, [existing, existingStaffOrgId]);

  useEffect(() => {
    if (!existing || !person) return;
    let active = true;
    void api<Role[]>(`rbac/users/${person.userId}/roles`).then(rows => {
      if (active) setAssignments(rows.filter(row => row.branchId === branchId));
    }).catch(reason => {
      if (active) setLoadError(extractErrorMessage(reason, "Could not load assigned roles."));
    });
    return () => { active = false; };
  }, [existing, person, branchId]);

  const availableRoles = branchRoles.filter(role => !assignments?.some(assigned => assigned.id === role.id));
  const ready = existing
    ? person && assignments && availableRoles.some(role => role.id === existingRoleId)
    : form.firstName.trim() && form.lastName.trim() && form.emailId.trim() && form.designation.trim() && form.joiningDate && form.roleId;

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>Add staff to {branchName}</Typography><DialogContentText sx={{ mt: 0.5 }}>Add a team member and assign their branch role.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {existingStaffOrgId && <Tabs aria-label="Staff source" value={existing ? "existing" : "new"} onChange={(_, mode: string) => {
          setExisting(mode === "existing");
          setPerson(null);
          setExistingRoleId("");
          setLoadError("");
          setAssignments(null);
        }}>
          <Tab value="existing" label="Existing staff" disabled={saving} />
          <Tab value="new" label="New staff" disabled={saving} />
        </Tabs>}
        {(error || loadError) && <Alert severity="error">{error || loadError}</Alert>}
        {existing ? <>
          <Autocomplete options={people ?? []} value={person} loading={!people && !loadError} disabled={saving}
            noOptionsText="No matching active staff in this organisation"
            getOptionKey={row => row.userId}
            getOptionLabel={row => `${row.firstName} ${row.lastName} (${row.emailId})`}
            isOptionEqualToValue={(option, value) => option.userId === value.userId}
            onChange={(_, value) => {
              setPerson(value);
              setAssignments(null);
              setExistingRoleId("");
              setLoadError("");
            }}
            renderInput={params => <TextField {...params} required label="Organisation staff member" />} />
          <TextField required select label="Branch role" value={existingRoleId} disabled={saving || rolesLoading || !assignments || !availableRoles.length}
            helperText={assignments && !rolesLoading && !availableRoles.length ? "No additional branch roles are available for this person." : undefined}
            onChange={event => setExistingRoleId(event.target.value)}>
            {availableRoles.map(role => <MenuItem key={role.id} value={role.id}>{role.name.replaceAll("_", " ")}</MenuItem>)}
          </TextField>
        </> : <>
          <TextField required label="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
          <TextField required label="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
          <TextField required type="email" label="Email" value={form.emailId} onChange={(event) => setForm({ ...form, emailId: event.target.value })} />
          <TextField label="Phone number" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
          <TextField required label="Designation" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
          <TextField required select disabled={rolesLoading} label="Branch role" value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
            {branchRoles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
          </TextField>
          <TextField required type="date" label="Joining date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
        </>}
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => onClose()} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void onSave(existing && person ? { userId: person.userId, roleId: existingRoleId } : form)} disabled={saving || rolesLoading || !ready}>Add staff</Button></DialogActions>
    </Dialog>
  );
}
