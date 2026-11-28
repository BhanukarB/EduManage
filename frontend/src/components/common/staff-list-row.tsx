import { Avatar, Button, FormControlLabel, ListItem, ListItemText, MenuItem, Stack, Switch, TextField } from "@mui/material";
import type { Branch, Staff } from "@/types/domain";
import { statusLabel } from "@/lib/formatters";

interface StaffListRowProps {
  person: Staff;
  branches: Pick<Branch, "id" | "branchName">[];
  disabled?: boolean;
  onDesignationChange: (person: Staff, value: string) => void;
  onBranchChange: (person: Staff, branchId: string | null) => void;
  onStatusChange: (person: Staff, status: number) => void;
  onManageRoles?: (person: Staff) => void;
  branchScoped?: boolean;
}

export function StaffListRow({ person, branches, disabled = false, onDesignationChange, onBranchChange, onStatusChange, onManageRoles, branchScoped = false }: StaffListRowProps) {
  return <ListItem disableGutters sx={{ display: "block", py: 1, mb: 1 }}>
    <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2 }, border: "1px solid", borderColor: "divider", borderRadius: "12px", bgcolor: "background.paper" }}>
      <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
        <Avatar sx={{ bgcolor: "primary.light", color: "primary.dark", width: 40, height: 40 }}>{person.firstName.charAt(0).toUpperCase()}</Avatar>
        <ListItemText sx={{ flex: "1 1 12rem", minWidth: 0, overflowWrap: "anywhere" }} primary={`${person.firstName} ${person.lastName}`} secondary={[person.emailId, person.phoneNumber].filter(Boolean).join(" · ")} />
        <FormControlLabel sx={{ mr: 0, flexShrink: 0 }} control={<Switch checked={person.status === 1} disabled={disabled} onChange={(_, checked) => onStatusChange(person, checked ? 1 : 0)} />} label={statusLabel(person.status)} />
      </Stack>
      {!branchScoped && <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField size="small" label="Designation" defaultValue={person.designation} onBlur={(event) => onDesignationChange(person, event.target.value)} helperText="Changes save when you leave this field." sx={{ flex: 1, minWidth: 0 }} />
        {!onManageRoles && <TextField select size="small" label="Branch" value={person.branchId ?? ""} onChange={(event) => onBranchChange(person, event.target.value || null)} sx={{ flex: 1, minWidth: 0 }}>
          <MenuItem value="">No branch</MenuItem>{branches.map((branch) => <MenuItem key={branch.id} value={branch.id}>{branch.branchName}</MenuItem>)}
        </TextField>}
      </Stack>}
      {onManageRoles && <Button variant="outlined" onClick={() => onManageRoles(person)} sx={{ alignSelf: "flex-start" }}>Manage roles</Button>}
    </Stack>
  </ListItem>;
}
