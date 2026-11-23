import type { Dispatch, SetStateAction } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import EditOutlined from "@mui/icons-material/EditOutlined";
import type { Organisation } from "@/types/domain";
import { orgTypeLabel } from "@/lib/formatters";

export type OrganisationForm = Pick<Organisation, "name" | "tagline" | "type" | "emailId" | "phoneNumber">;
export interface OrganisationAdmin {
  id: string;
  orgId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
}
export interface AdminUserForm {
  firstName: string;
  lastName: string;
  emailId: string;
  phoneNumber: string;
}

interface OrganisationDialogsProps {
  mode: "create" | "edit" | null;
  setMode: (mode: "create" | "edit" | null) => void;
  form: OrganisationForm;
  setForm: Dispatch<SetStateAction<OrganisationForm>>;
  selected: Organisation | null;
  detailsOpen: boolean;
  setDetailsOpen: (open: boolean) => void;
  admins: OrganisationAdmin[];
  adminsLoading: boolean;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  editingAdmin: OrganisationAdmin | null;
  adminForm: AdminUserForm;
  setAdminForm: Dispatch<SetStateAction<AdminUserForm>>;
  saving: boolean;
  error: string | null;
  onSaveOrganisation: () => void;
  onEditOrganisation: (organisation: Organisation) => void;
  onOpenAdmin: () => void;
  onSaveAdmin: () => void;
}

export function OrganisationDialogs(props: OrganisationDialogsProps) {
  return <>
    <Dialog open={Boolean(props.mode)} onClose={() => !props.saving && props.setMode(null)} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>{props.mode === "edit" ? "Edit organisation" : "Create organisation"}</Typography><DialogContentText sx={{ mt: 0.5 }}>Keep your organisation details up to date.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {props.error && <Alert severity="error" variant="filled" sx={{ mb: 1 }}>{props.error}</Alert>}
        <TextField required label="Organisation name" value={props.form.name} onChange={(event) => props.setForm({ ...props.form, name: event.target.value })} />
        <TextField label="Tagline" value={props.form.tagline ?? ""} onChange={(event) => props.setForm({ ...props.form, tagline: event.target.value })} />
        <TextField select label="Organisation type" value={props.form.type} onChange={(event) => props.setForm({ ...props.form, type: Number(event.target.value) })}><MenuItem value={1}>School</MenuItem><MenuItem value={2}>Coaching</MenuItem></TextField>
        <TextField required type="email" label="Email" value={props.form.emailId} onChange={(event) => props.setForm({ ...props.form, emailId: event.target.value })} />
        <TextField label="Phone number" value={props.form.phoneNumber ?? ""} onChange={(event) => props.setForm({ ...props.form, phoneNumber: event.target.value })} />
      </Stack></DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}><Button onClick={() => props.setMode(null)} disabled={props.saving}>Cancel</Button><Button variant="contained" onClick={props.onSaveOrganisation} disabled={props.saving || !props.form.name.trim() || !props.form.emailId.trim()}>{props.saving ? "Saving…" : "Save organisation"}</Button></DialogActions>
    </Dialog>

    <Dialog open={props.detailsOpen} onClose={() => props.setDetailsOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{props.selected?.name ?? "Organisation details"}</DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {props.selected && <>
          <Typography><strong>Type:</strong> {orgTypeLabel(props.selected.type)}</Typography>
          <Typography><strong>Email:</strong> {props.selected.emailId}</Typography>
          {props.selected.phoneNumber && <Typography><strong>Phone:</strong> {props.selected.phoneNumber}</Typography>}
          {props.selected.tagline && <Typography><strong>Tagline:</strong> {props.selected.tagline}</Typography>}
          {props.selected.address && <Typography><strong>Address:</strong> {Object.values(props.selected.address).filter(Boolean).join(", ")}</Typography>}
          <Divider /><Typography variant="subtitle1" fontWeight={600}>Organisation admins</Typography>
        </>}
        {props.error && <Alert severity="error">{props.error}</Alert>}
        {props.adminsLoading ? <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}><CircularProgress size={24} /></Box> : props.admins.length ? props.admins.map((admin) => <Typography key={admin.id}>{admin.firstName} {admin.lastName} · {admin.emailId}</Typography>) : !props.error && <Typography color="text.secondary">No org_admin users assigned.</Typography>}
      </Stack></DialogContent>
      <DialogActions>
        <Button startIcon={<EditOutlined />} onClick={() => { if (props.selected) props.onEditOrganisation(props.selected); }}>Edit organisation</Button>
        <Button onClick={() => props.setDetailsOpen(false)}>Close</Button>
        <Button variant="contained" onClick={props.onOpenAdmin} disabled={props.adminsLoading}>{props.admins.length ? "Update org_admin" : "Add org_admin"}</Button>
      </DialogActions>
    </Dialog>

    <Dialog open={props.adminOpen} onClose={() => !props.saving && props.setAdminOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle component="div" sx={{ pb: 1 }}><Typography variant="h6" component="h2" fontWeight={700}>{props.editingAdmin ? "Update org_admin" : "Add org_admin"}</Typography><DialogContentText sx={{ mt: 0.5 }}>Manage administrator access for this organisation.</DialogContentText></DialogTitle>
      <DialogContent dividers sx={{ pt: 3, pb: 3 }}><Stack spacing={2.5}>
        {props.error && <Alert severity="error" variant="filled" sx={{ mb: 1 }}>{props.error}</Alert>}
        <Typography color="text.secondary">{props.selected?.name}</Typography>
        <TextField required label="First name" value={props.adminForm.firstName} onChange={(event) => props.setAdminForm({ ...props.adminForm, firstName: event.target.value })} />
        <TextField required label="Last name" value={props.adminForm.lastName} onChange={(event) => props.setAdminForm({ ...props.adminForm, lastName: event.target.value })} />
        <TextField required type="email" label="Email" value={props.adminForm.emailId} onChange={(event) => props.setAdminForm({ ...props.adminForm, emailId: event.target.value })} />
        <TextField label="Phone number" value={props.adminForm.phoneNumber} onChange={(event) => props.setAdminForm({ ...props.adminForm, phoneNumber: event.target.value })} />
        {!props.editingAdmin && <Typography variant="caption" color="text.secondary">The account is created with the system’s default password.</Typography>}
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => props.setAdminOpen(false)} disabled={props.saving}>Cancel</Button><Button variant="contained" onClick={props.onSaveAdmin} disabled={props.saving || !props.adminForm.firstName.trim() || !props.adminForm.lastName.trim() || !props.adminForm.emailId.trim()}>{props.saving ? "Saving…" : props.editingAdmin ? "Update org_admin" : "Add org_admin"}</Button></DialogActions>
    </Dialog>
  </>;
}
