"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Breadcrumbs, Link as MuiLink, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Stack, TextField, Typography } from "@mui/material";
import { api, extractErrorMessage, readApi } from "@/lib/api";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { PageHeader } from "@/components/common/page-header";

interface Contact {
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string | null;
}
interface Student extends Contact {
  id: string;
  enrollmentNumber: string;
  emailId: string | null;
  guardians: Contact[];
}
interface RosterPage {
  group: { name: string; classId: string; className: string; academicSessionId: string };
  items: Student[];
  page: number;
  pageSize: number;
  total: number;
}
interface RosterProps {
  orgId: string;
  branchId: string;
  classId: string;
  groupId: string;
  groupType: "sections" | "batches";
}
const fields = [
  ["firstName", "First name"], ["lastName", "Last name"], ["emailId", "Email"],
  ["phoneNumber", "Phone number"], ["enrollmentNumber", "Enrollment number"],
  ["guardianName", "Guardian name"], ["guardianContact", "Guardian contact"],
] as const;

function name(contact: Contact): string {
  return [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(" ");
}

export function StudentRosterPage({ orgId, branchId, classId, groupId, groupType }: RosterProps): ReactElement {
  const search = useSearchParams();
  const page = search.get("page") ?? "1";
  const pageSize = search.get("pageSize") ?? "10";
  const params = new URLSearchParams({ page, pageSize });
  const path = `organisations/${orgId}/branches/${branchId}/${groupType}/${groupId}/students?${params}`;
  const [result, setResult] = useState<{ path: string; data?: RosterPage; error?: string } | null>(null);
  const current = result?.path === path ? result : null;
  const roster = current?.data;
  const group = roster?.group;
  const [selected, setSelected] = useState<Student | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    readApi<RosterPage>(path).then(data => {
      if (!active) return;
      setResult(data.group.classId === classId ? { path, data } : { path, error: "This group belongs to another class." });
    })
      .catch(reason => { if (active) setResult({ path, error: extractErrorMessage(reason, "Could not load students.") }); });
    return () => { active = false; };
  }, [classId, path, revision]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!group) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError("");
    try {
      await api(`organisations/${orgId}/students/add`, { method: "POST", body: JSON.stringify({
        ...values, classId, branchId, academicSessionId: group.academicSessionId,
        [groupType === "sections" ? "sectionId" : "batchId"]: groupId,
      }) });
      setAdding(false);
      setConfirmation(`${values.firstName} ${values.lastName} enrolled in ${group.name}.`);
      setResult(null);
      setRevision(value => value + 1);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not enroll student."));
    } finally {
      setSaving(false);
    }
  }

  function close(): void {
    if (saving) return;
    setAdding(false);
    setSelected(null);
    setError("");
  }

  function paginate(nextPage: number, nextSize: number): void {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(nextPage));
    url.searchParams.set("pageSize", String(nextSize));
    window.history.pushState(null, "", url);
  }

  return <BranchWorkspace>
    <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 3 }}>
      <MuiLink component={Link} href="/classes">Classes</MuiLink>
      <MuiLink component={Link} href={`/classes/${classId}`}>{group?.className ?? "Class details"}</MuiLink>
      <Typography color="text.primary">Students</Typography>
    </Breadcrumbs>
    <PageHeader title="Students" subtitle={group && `${group.className} · ${group.name}`}
      action={group && <Button variant="contained" onClick={() => { setConfirmation(""); setAdding(true); }}>Add student</Button>} />
    {confirmation && <Alert severity="success" sx={{ mb: 2 }}>{confirmation}</Alert>}
    {current?.error ? <Alert severity="error">{current.error}</Alert> : !roster ? <CircularProgress aria-label="Loading students" /> :
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table aria-label="Students" sx={{ minWidth: 620 }}>
            <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700 } }}>
              <TableRow>{["Student name", "Enrollment number", "Email", "Phone number"].map(label =>
                <TableCell key={label}>{label}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {roster.items.map(student => <TableRow hover key={student.id}
                onClick={() => setSelected(student)}
                sx={{ cursor: "pointer", "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" } }}>
                <TableCell><Button variant="text" sx={{ textTransform: "none", fontWeight: 600, px: 0 }}
                  onClick={() => setSelected(student)}>{name(student)}</Button></TableCell>
                <TableCell>{student.enrollmentNumber}</TableCell>
                <TableCell>{student.emailId || "—"}</TableCell>
                <TableCell>{student.phoneNumber || "—"}</TableCell>
              </TableRow>)}
              {!roster.items.length && <TableRow><TableCell colSpan={4}>No students enrolled.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={roster.total} page={roster.page - 1} rowsPerPage={roster.pageSize}
          rowsPerPageOptions={Array.from(new Set([2, 5, 10, 25, 50, roster.pageSize])).sort((a, b) => a - b)}
          onPageChange={(_, index) => paginate(index + 1, roster.pageSize)}
          onRowsPerPageChange={event => paginate(1, Number(event.target.value))} />
      </Paper>}
    <Dialog open={adding || Boolean(selected)} fullWidth maxWidth="sm" onClose={close} aria-labelledby="student-dialog-title">
    <DialogTitle id="student-dialog-title">{adding ? "Add student" : selected && name(selected)}</DialogTitle>
    <DialogContent dividers>
      {error && <Alert severity="error">{error}</Alert>}
      {adding ? <Stack component="form" id="student-enrollment-form" spacing={2} onSubmit={submit} sx={{ pt: 1 }}>
        <Typography color="text.secondary">{group?.name}</Typography>
        {fields.map(([key, label]) => <TextField required key={key} name={key} label={label}
          type={key === "emailId" ? "email" : ["phoneNumber", "guardianContact"].includes(key) ? "tel" : "text"} />)}
        <TextField required name="enrollmentDate" label="Enrollment date" type="date"
          defaultValue={new Date().toLocaleDateString("en-CA")} slotProps={{ inputLabel: { shrink: true } }} />
      </Stack> : selected ? <Stack spacing={1}>
        <Typography>Enrollment number: {selected.enrollmentNumber}</Typography>
        <Typography>Email: {selected.emailId || "—"}</Typography>
        <Typography>Phone number: {selected.phoneNumber || "—"}</Typography>
        {selected.guardians.length ? selected.guardians.map((guardian, index) => <Stack key={index}>
          <Typography>Guardian name: {name(guardian)}</Typography>
          <Typography>Guardian contact: {guardian.phoneNumber || "—"}</Typography>
        </Stack>) : <Typography>No guardian recorded.</Typography>}
      </Stack> : null}
    </DialogContent>
    <DialogActions>
      <Button onClick={close} disabled={saving}>{adding ? "Cancel" : selected ? "Back to students" : "Close"}</Button>
      {adding && <Button variant="contained" form="student-enrollment-form" type="submit" disabled={saving}>Enroll student</Button>}
    </DialogActions>
    </Dialog>
  </BranchWorkspace>;
}
