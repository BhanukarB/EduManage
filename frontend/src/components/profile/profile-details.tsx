"use client";

import { useEffect, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import {
  Alert, Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, IconButton, Stack, TextField, Typography,
} from "@mui/material";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { SignOutButton } from "@/components/sign-out-button";
import { api, extractErrorMessage } from "@/lib/api";

interface Person {
  firstName: string;
  middleName?: string | null;
  lastName: string;
}

interface UserProfile extends Person {
  emailId: string;
  phoneNumber: string | null;
  organisationName: string | null;
  branchName?: string | null;
  joiningDate: string | null;
  guardians?: (Person & { relation: string })[];
}

function fullName(person: Person): string {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

function Detail({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
      <Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>{children}</Typography>
    </Box>
  );
}

export function ProfileDetails({ onClose }: { onClose: () => void }): ReactElement {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    api<UserProfile>("users/me").then(user => {
      if (active) setProfile(user);
    }).catch((reason: unknown) => {
      if (active) setError(extractErrorMessage(reason, "Could not load your profile."));
    });
    return () => { active = false; };
  }, []);

  async function save(event: FormEvent): Promise<void> {
    event.preventDefault();
    const phoneNumber = phone.trim();
    if (!/^(?:[0-9]{10}|\+[1-9][0-9]{7,14})$/.test(phoneNumber)) {
      setInvalid(true);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await api<{ phoneNumber: string }>("users/me", {
        method: "PATCH", body: JSON.stringify({ phoneNumber }),
      });
      setProfile(current => current && { ...current, phoneNumber: updated.phoneNumber });
      setEditing(false);
      setSaved(true);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not update your phone number."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="profile-title"
      slotProps={{ paper: { sx: { m: { xs: 2, sm: 4 }, width: { xs: "calc(100% - 32px)", sm: "100%" } } } }}>
      <DialogTitle id="profile-title" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Your profile
        <IconButton aria-label="Close profile" onClick={onClose} disabled={saving}><CloseOutlined /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}
          {saved && <Alert severity="success">Phone number updated.</Alert>}
          {profile ? <>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "primary.main" }}>{profile.firstName.charAt(0).toUpperCase()}</Avatar>
              <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                <Typography variant="h6">{fullName(profile)}</Typography>
                <Typography variant="body2" color="text.secondary">{profile.emailId}</Typography>
              </Box>
            </Stack>
            <Divider />
            <Box component="dl" sx={{ m: 0, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              {!editing && <Detail label="Phone number">{profile.phoneNumber || "Not provided"}</Detail>}
              <Detail label="Organisation">{profile.organisationName || "Not assigned"}</Detail>
              {profile.branchName !== undefined && <Detail label="Branch">{profile.branchName || "Not assigned"}</Detail>}
              <Detail label="Joining date">{profile.joiningDate
                ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(profile.joiningDate))
                : "Not available"}</Detail>
              {profile.guardians && <Detail label="Student guardians">
                {profile.guardians.map(g => `${fullName(g)} (${g.relation})`).join(", ") || "None listed"}
              </Detail>}
            </Box>
            {editing && <Box component="form" id="profile-phone" noValidate onSubmit={save}>
              <TextField autoFocus fullWidth required type="tel" autoComplete="tel" label="Phone number"
                value={phone} disabled={saving} error={invalid}
                helperText={invalid ? "Enter 10 digits or + followed by 8–15 digits, starting with 1–9." : "For example, 9876543210 or +919876543210."}
                onChange={event => { setPhone(event.target.value); setInvalid(false); }} />
            </Box>}
          </> : !error && <Typography role="status">Loading your profile…</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "space-between", px: 2, py: 1.5 }}>
        <SignOutButton />
        {profile && (editing
          ? <Button key="save" type="submit" form="profile-phone" variant="contained" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          : <Button key="edit" type="button" variant="outlined" startIcon={<EditOutlined />} onClick={event => {
              event.preventDefault();
              setPhone(profile.phoneNumber ?? "");
              setSaved(false);
              setEditing(true);
            }}>Edit profile</Button>)}
      </DialogActions>
    </Dialog>
  );
}
