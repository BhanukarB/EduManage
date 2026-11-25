"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { PageHeader } from "@/components/common/page-header";
import { PanelLoading } from "@/components/common/panel-loading";
import { api, extractErrorMessage } from "@/lib/api";

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  description: string | null;
}

export function SubjectsPage({ orgId }: { orgId: string }): ReactElement {
  const path = `organisations/${orgId}/subjects`;
  const [subjects, setSubjects] = useState<Subject[] | null>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void api<Subject[]>(path)
      .then((rows) => { if (active) setSubjects(rows); })
      .catch((error: unknown) => { if (active) setLoadError(extractErrorMessage(error, "Could not load subjects.")); });
    return () => { active = false; };
  }, [path]);

  async function createSubject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (saving || !subjects) return;
    const fields = new FormData(event.currentTarget);
    const subjectName = String(fields.get("name") ?? "").trim();
    const subjectCode = String(fields.get("code") ?? "").trim();
    const description = String(fields.get("description") ?? "").trim();
    if (!subjectName || !subjectCode) {
      setFormError("Enter a subject name and code.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const created = await api<Subject>(`${path}/create`, {
        method: "POST", body: JSON.stringify({ subjectName, subjectCode, description: description || null }),
      });
      const updated = [...subjects, created].sort((a, b) => a.subjectName.localeCompare(b.subjectName));
      setSubjects(updated);
      setPage(Math.floor(updated.findIndex((subject) => subject.id === created.id) / size));
      setOpen(false);
      setNotice(`${created.subjectName} created.`);
    } catch (error) {
      setFormError(extractErrorMessage(error, "Could not create the subject."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="main" sx={{ maxWidth: 1360, mx: "auto", p: { xs: 2, md: 5 } }}>
      <PageHeader title="Subjects" action={
        <Button variant="contained" disabled={!subjects} onClick={() => { setFormError(""); setNotice(""); setOpen(true); }}>
          Create subject
        </Button>
      } />
      {notice && <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert>}
      {loadError ? <Alert severity="error">{loadError}</Alert> : !subjects ? <PanelLoading /> : (
        <Paper variant="outlined">
          <TableContainer>
            <Table aria-label="Subjects">
              <TableHead><TableRow><TableCell>Subject name</TableCell><TableCell>Code</TableCell><TableCell>Description</TableCell></TableRow></TableHead>
              <TableBody>
                {subjects.length === 0 && <TableRow><TableCell colSpan={3}>No subjects yet.</TableCell></TableRow>}
                {subjects.slice(page * size, (page + 1) * size).map((subject) => (
                  <TableRow key={subject.id} sx={{ overflowWrap: "anywhere" }}>
                    <TableCell component="th" scope="row">{subject.subjectName}</TableCell>
                    <TableCell>{subject.subjectCode}</TableCell><TableCell>{subject.description || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={subjects.length} page={page} rowsPerPage={size}
            rowsPerPageOptions={[5, 10, 25]} onPageChange={(_, next) => setPage(next)}
            onRowsPerPageChange={(event) => { setSize(Number(event.target.value)); setPage(0); }} />
        </Paper>
      )}
      <Dialog open={open} onClose={() => { if (!saving) setOpen(false); }} fullWidth maxWidth="sm" aria-labelledby="create-subject-title">
        <Box component="form" onSubmit={createSubject}>
          <DialogTitle id="create-subject-title">Create subject</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField label="Subject name" name="name" required slotProps={{ htmlInput: { maxLength: 255 } }} />
              <TextField label="Subject code" name="code" required slotProps={{ htmlInput: { maxLength: 255 } }} />
              <TextField label="Description" name="description" multiline minRows={2} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saving} variant="contained" type="submit">{saving ? "Creating…" : "Create subject"}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
