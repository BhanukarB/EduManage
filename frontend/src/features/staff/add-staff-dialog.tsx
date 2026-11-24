"use client";

import { useState, type ReactNode } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { Role } from "@/types/domain";

export interface AddStaffForm {
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
  designation: string;
  joiningDate: string;
  roleId: string;
}

interface AddStaffDialogProps {
  open: boolean;
  branchName: string;
  branchRoles: Role[];
  rolesLoading: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (form: AddStaffForm) => Promise<boolean>;
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

export function AddStaffDialog({ open, branchName, branchRoles, rolesLoading, saving, error, onClose, onSave }: AddStaffDialogProps): ReactNode {
  const [form, setForm] = useState(emptyStaffForm);

  async function submit(): Promise<void> {
    if (await onSave(form)) setForm(emptyStaffForm());
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>Add staff to {branchName}</Typography><DialogContentText sx={{ mt: 0.5 }}>Add a team member and assign their branch role.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField required label="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
        <TextField required label="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
        <TextField required type="email" label="Email" value={form.emailId} onChange={(event) => setForm({ ...form, emailId: event.target.value })} />
        <TextField label="Phone number" value={form.phoneNumber} onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })} />
        <TextField required label="Designation" value={form.designation} onChange={(event) => setForm({ ...form, designation: event.target.value })} />
        <TextField required select disabled={rolesLoading} label="Branch role" value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
          {branchRoles.map((role) => <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}
        </TextField>
        <TextField required type="date" label="Joining date" InputLabelProps={{ shrink: true }} value={form.joiningDate} onChange={(event) => setForm({ ...form, joiningDate: event.target.value })} />
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => onClose()} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void submit()} disabled={saving || rolesLoading || !form.firstName.trim() || !form.lastName.trim() || !form.emailId.trim() || !form.designation.trim() || !form.roleId}>Add staff</Button></DialogActions>
    </Dialog>
  );
}
