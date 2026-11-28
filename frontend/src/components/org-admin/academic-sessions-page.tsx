"use client";

import { useEffect, useState, type ReactElement } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import { PageHeader } from "@/components/common/page-header";
import { PanelLoading } from "@/components/common/panel-loading";
import { StatusChip } from "@/components/common/status-chip";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import type { AcademicSession } from "@/types/domain";

interface SessionFormState {
  sessionName: string;
  startDate: string;
  endDate: string;
  status: number;
}

const emptyForm: SessionFormState = {
  sessionName: "",
  startDate: "",
  endDate: "",
  status: 1,
};

function toDateInput(value?: string): string {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function AcademicSessionsPage({ orgId }: { orgId: string }): ReactElement {
  const [sessions, setSessions] = useState<AcademicSession[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicSession | null>(null);
  const [form, setForm] = useState<SessionFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void readApi<AcademicSession[]>(`organisations/${orgId}/academic-sessions`)
      .then((data) => {
        if (active) {
          setSessions(data);
          setLoadError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) setLoadError(extractErrorMessage(reason, "Could not load academic sessions."));
      });
    return () => { active = false; };
  }, [orgId]);

  const openCreate = (): void => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (session: AcademicSession): void => {
    setEditing(session);
    setForm({
      sessionName: session.sessionName ?? "",
      startDate: toDateInput(session.startDate),
      endDate: toDateInput(session.endDate),
      status: session.status,
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const applySavedSession = (saved: AcademicSession, isEdit: boolean): void => {
    setSessions((current) => {
      const list = current ?? [];
      const updatedList = saved.status === 1
        ? list.map((item) => (item.id === saved.id ? saved : { ...item, status: 0 }))
        : list.map((item) => (item.id === saved.id ? saved : item));
      return isEdit ? updatedList : [saved, ...updatedList];
    });
  };

  const saveSession = async (): Promise<void> => {
    if (!form.startDate || !form.endDate) {
      setFormError("Start date and end date are required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError("End date must be on or after start date.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        sessionName: form.sessionName.trim() || null,
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      };
      const saved = editing
        ? await api<AcademicSession>(`organisations/${orgId}/academic-sessions/update/${editing.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await api<AcademicSession>(`organisations/${orgId}/academic-sessions/create`, {
            method: "POST",
            body: JSON.stringify(payload),
          });
      applySavedSession(saved, Boolean(editing));
      setDialogOpen(false);
      setNotice(editing ? "Academic session updated." : "Academic session created.");
    } catch (reason) {
      setFormError(extractErrorMessage(reason, "Could not save academic session."));
    } finally {
      setSaving(false);
    }
  };

  const loading = !sessions && !loadError;

  return (
    <Box component="main" sx={{ flex: 1, minWidth: 0, maxWidth: 1360, mx: "auto", p: { xs: 2, md: 5 } }}>
      <PageHeader
        title="Academic Sessions"
        subtitle="Manage academic sessions for your organisation"
        action={
          <Button variant="contained" disabled={loading} startIcon={<AddOutlined />} onClick={openCreate}>
            Add academic session
          </Button>
        }
      />
      {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2, md: 3 } }}>
        {loading ? (
          <PanelLoading padding={8} />
        ) : sessions?.length ? (
          <TableContainer sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: 2, overflowX: "auto" }}>
            <Table className="mobile-records" aria-label="Academic sessions" sx={{ minWidth: 620 }}>
              <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700, borderBottom: "1px solid", borderColor: "grey.300" } }}>
                <TableRow>
                  <TableCell scope="col">Session name</TableCell>
                  <TableCell scope="col">Start date</TableCell>
                  <TableCell scope="col">End date</TableCell>
                  <TableCell scope="col">Status</TableCell>
                  <TableCell scope="col" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow
                    key={session.id}
                    sx={{
                      "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" },
                      "&:last-child > td": { borderBottom: 0 },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {session.sessionName?.trim() || `${toDateInput(session.startDate)} – ${toDateInput(session.endDate)}`}
                    </TableCell>
                    <TableCell data-label="Start date">{toDateInput(session.startDate)}</TableCell>
                    <TableCell data-label="End date">{toDateInput(session.endDate)}</TableCell>
                    <TableCell data-label="Status"><StatusChip status={session.status} /></TableCell>
                    <TableCell data-label="Actions" align="right">
                      <Button size="small" onClick={() => openEdit(session)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            No academic sessions have been created yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle component="div" sx={{ pb: 1 }}>
          <Typography variant="h6" component="h2" fontWeight={700}>
            {editing ? "Update academic session" : "Add academic session"}
          </Typography>
          <DialogContentText sx={{ mt: 0.5 }}>
            {editing
              ? "Update the academic session details or switch which session is active."
              : "Create an academic session for your organisation."}
          </DialogContentText>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, pb: 3 }}>
          <Stack spacing={2.5}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label="Session name"
              placeholder="e.g. 2026-27"
              value={form.sessionName}
              onChange={(event) => setForm({ ...form, sessionName: event.target.value })}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                fullWidth
                type="date"
                label="Start date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.startDate}
                onChange={(event) => setForm({ ...form, startDate: event.target.value })}
              />
              <TextField
                required
                fullWidth
                type="date"
                label="End date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={form.endDate}
                onChange={(event) => setForm({ ...form, endDate: event.target.value })}
              />
            </Stack>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: Number(event.target.value) })}
              helperText="Setting a session as Active will automatically mark other sessions in this organisation as Inactive."
              fullWidth
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void saveSession()}
            disabled={saving || !form.startDate || !form.endDate}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Create session"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
    </Box>
  );
}
