"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Alert, Box, Breadcrumbs, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, List, ListItemButton, ListItemText, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Typography } from "@mui/material";
import { api, extractErrorMessage, readApi } from "@/lib/api";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { SectionHeader } from "@/components/pages/section-details-page";
import { PageHeader } from "@/components/common/page-header";
import type { AcademicSession } from "@/types/domain";

import { useActiveContextQuery } from "@/lib/active-context";

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
interface ListPage {
  group: { name: string; classId: string; className: string; academicSessionId?: string };
  items: Student[];
  page: number;
  pageSize: number;
  total: number;
}
interface BranchStudent extends Contact {
  id: string;
  userId: string;
  enrollmentNumber: string;
  emailId: string | null;
  classId: string;
  className: string;
  batchId: string | null;
  batchName: string | null;
  sectionId: string | null;
  sectionCode: string | null;
}
interface BranchStudentPage {
  items: BranchStudent[];
  total: number;
  page: number;
  pageSize: number;
}
interface StudentListProps {
  orgId: string;
  branchId: string;
  classId: string;
  groupId: string;
  groupType: "sections" | "batches";
  readOnly?: boolean;
}
const fields = [
  ["firstName", "First name"], ["lastName", "Last name"], ["emailId", "Email"],
  ["phoneNumber", "Phone number"], ["enrollmentNumber", "Enrollment number"],
  ["guardianName", "Guardian name"], ["guardianContact", "Guardian contact"],
] as const;

function name(contact: Contact): string {
  return [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(" ");
}

export function StudentListPage({ orgId, branchId, classId, groupId, groupType, readOnly = false }: StudentListProps): ReactElement {
  const contextQuery = useActiveContextQuery();
  const search = useSearchParams();
  const page = search.get("page") ?? "1";
  const pageSize = search.get("pageSize") ?? "10";
  const params = new URLSearchParams({ page, pageSize });
  const path = `organisations/${orgId}/branches/${branchId}/${groupType}/${groupId}/students?${params}`;
  const [result, setResult] = useState<{ path: string; data?: ListPage; error?: string } | null>(null);
  const current = result?.path === path ? result : null;
  const list = current?.data;
  const group = list?.group;
  const [selected, setSelected] = useState<Student | null>(null);
  const [adding, setAdding] = useState(false);
  const [addMode, setAddMode] = useState<"new" | "existing">("new");
  const [branchSearch, setBranchSearch] = useState("");
  const [branchStudents, setBranchStudents] = useState<BranchStudent[]>([]);
  const [branchStudentsLoading, setBranchStudentsLoading] = useState(false);
  const [branchStudentsError, setBranchStudentsError] = useState("");
  const [selectedExistingId, setSelectedExistingId] = useState<string>("");
  const [existingEnrollmentDate, setExistingEnrollmentDate] = useState<string>(() => new Date().toLocaleDateString("en-CA"));
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [sessions, setSessions] = useState<AcademicSession[] | null>(null);
  useEffect(() => {
    if (readOnly) return;
    let active = true;
    readApi<AcademicSession[]>(`organisations/${orgId}/academic-sessions`, 30_000)
      .then((data) => { if (active) setSessions(data); })
      .catch(() => { if (active) setSessions([]); });
    return () => { active = false; };
  }, [orgId, readOnly]);
  const groupSession = groupType === "sections"
    ? sessions?.find((session) => session.status === 1)
    : sessions?.find((session) => session.id === group?.academicSessionId);
  const isActiveSession = groupSession?.status === 1;
  useEffect(() => {
    let active = true;
    readApi<ListPage>(path).then(data => {
      if (!active) return;
      setResult(data.group.classId === classId ? { path, data } : { path, error: "This group belongs to another class." });
    })
      .catch(reason => { if (active) setResult({ path, error: extractErrorMessage(reason, "Could not load students.") }); });
    return () => { active = false; };
  }, [classId, path, revision]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!group || !groupSession || !isActiveSession) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setSaving(true);
    setError("");
    try {
      await api(`organisations/${orgId}/students/add`, { method: "POST", body: JSON.stringify({
        ...values, classId, branchId, academicSessionId: groupSession.id,
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

  useEffect(() => {
    if (!adding || groupType !== "batches" || addMode !== "existing") return;
    let active = true;
    const query = new URLSearchParams({ page: "1", pageSize: "50", classId, excludeBatchId: groupId });
    if (branchSearch.trim()) query.set("search", branchSearch.trim());
    setBranchStudentsLoading(true);
    setBranchStudentsError("");
    readApi<BranchStudentPage>(`organisations/${orgId}/branches/${branchId}/students?${query}`)
      .then((data) => {
        if (!active) return;
        setBranchStudents(data.items);
      })
      .catch((reason) => {
        if (!active) return;
        setBranchStudentsError(extractErrorMessage(reason, "Could not load branch students."));
      })
      .finally(() => {
        if (active) setBranchStudentsLoading(false);
      });
    return () => { active = false; };
  }, [adding, addMode, branchId, branchSearch, groupId, groupType, orgId, revision]);

  async function submitExisting(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!group || !selectedExistingId) return;
    const chosen = branchStudents.find((student) => student.id === selectedExistingId);
    setSaving(true);
    setError("");
    try {
      await api(`organisations/${orgId}/branches/${branchId}/batches/${groupId}/students/add-existing`, {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedExistingId,
          ...(existingEnrollmentDate ? { enrollmentDate: existingEnrollmentDate } : {}),
        }),
      });
      setAdding(false);
      setSelectedExistingId("");
      setBranchSearch("");
      setConfirmation(`${chosen ? name(chosen) : "Student"} added to ${group.name}.`);
      setResult(null);
      setRevision((value) => value + 1);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not add student to batch."));
    } finally {
      setSaving(false);
    }
  }

  function close(): void {
    if (saving) return;
    setAdding(false);
    setAddMode("new");
    setSelectedExistingId("");
    setBranchSearch("");
    setBranchStudentsError("");
    setSelected(null);
    setError("");
  }

  function paginate(nextPage: number, nextSize: number): void {
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(nextPage));
    url.searchParams.set("pageSize", String(nextSize));
    window.history.pushState(null, "", url);
  }

  const addStudentAction = !readOnly && group ? <Button variant="contained" disabled={!isActiveSession}
    onClick={() => { setConfirmation(""); setAdding(true); }}>Add student</Button> : undefined;

  return <BranchWorkspace>
    {!readOnly && groupType === "sections" ? (
      <SectionHeader classId={classId} sectionId={groupId} name={group?.name} tab="students" action={addStudentAction} />
    ) : <>
    <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 3 }}>
      <MuiLink component={Link} href={`/classes${contextQuery}`}>Classes</MuiLink>
      {!readOnly && <MuiLink component={Link} href={`/classes/${classId}${contextQuery}`}>{group?.className ?? "Class details"}</MuiLink>}
      <Typography color="text.primary">Students</Typography>
    </Breadcrumbs>
    <PageHeader title="Student list" subtitle={group && `${group.className} · ${group.name}`}
      action={addStudentAction} />
    </>}
    {!readOnly && group && sessions && !isActiveSession && (
      <Alert severity="info" sx={{ mb: 2 }}>
        Student enrollment requires an active academic session.
      </Alert>
    )}
    {confirmation && <Alert severity="success" sx={{ mb: 2 }}>{confirmation}</Alert>}
    {current?.error ? <Alert severity="error">{current.error}</Alert> : !list ? <CircularProgress aria-label="Loading students" /> :
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table aria-label="Student list" sx={{ minWidth: 620 }}>
            <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700 } }}>
              <TableRow>{["Student name", "Enrollment number", "Email", "Phone number"].map(label =>
                <TableCell key={label}>{label}</TableCell>)}</TableRow>
            </TableHead>
            <TableBody>
              {list.items.map(student => <TableRow hover key={student.id}
                onClick={() => setSelected(student)}
                sx={{ cursor: "pointer", "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" } }}>
                <TableCell><Button variant="text" sx={{ textTransform: "none", fontWeight: 600, px: 0 }}
                  onClick={() => setSelected(student)}>{name(student)}</Button></TableCell>
                <TableCell>{student.enrollmentNumber}</TableCell>
                <TableCell>{student.emailId || "—"}</TableCell>
                <TableCell>{student.phoneNumber || "—"}</TableCell>
              </TableRow>)}
              {!list.items.length && <TableRow><TableCell colSpan={4}>No students enrolled.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={list.total} page={list.page - 1} rowsPerPage={list.pageSize}
          rowsPerPageOptions={Array.from(new Set([2, 5, 10, 25, 50, list.pageSize])).sort((a, b) => a - b)}
          onPageChange={(_, index) => paginate(index + 1, list.pageSize)}
          onRowsPerPageChange={event => paginate(1, Number(event.target.value))} />
      </Paper>}
    <Dialog open={adding || Boolean(selected)} fullWidth maxWidth="sm" onClose={close} aria-labelledby="student-dialog-title">
    <DialogTitle id="student-dialog-title">{adding ? "Add student" : selected && name(selected)}</DialogTitle>
    <DialogContent dividers>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {adding ? <>
        {groupType === "batches" && (
          <Tabs
            value={addMode}
            onChange={(_, nextMode: "new" | "existing") => {
              setAddMode(nextMode);
              setError("");
            }}
            sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="New student" value="new" />
            <Tab label="Existing student" value="existing" />
          </Tabs>
        )}
        {groupType === "batches" && addMode === "existing" ? (
          <Stack component="form" id="existing-student-enrollment-form" spacing={2} onSubmit={submitExisting} sx={{ pt: 0.5 }}>
            <Typography color="text.secondary">{group?.name}</Typography>
            <TextField
              label="Search branch students"
              placeholder="Search by name, email, or enrollment number"
              value={branchSearch}
              onChange={(event) => setBranchSearch(event.target.value)}
              size="small"
            />
            {branchStudentsError ? (
              <Alert severity="error">{branchStudentsError}</Alert>
            ) : branchStudentsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} aria-label="Loading branch students" />
              </Box>
            ) : branchStudents.length ? (
              <Paper variant="outlined" sx={{ maxHeight: 260, overflowY: "auto" }}>
                <List disablePadding aria-label="Branch students">
                  {branchStudents.map((student) => {
                    const currentPlacement = student.batchName
                      ? `Current batch: ${student.batchName}`
                      : student.sectionCode
                        ? `Current section: ${student.sectionCode}`
                        : `Class: ${student.className}`;
                    return (
                      <ListItemButton
                        key={student.id}
                        divider
                        selected={selectedExistingId === student.id}
                        onClick={() => setSelectedExistingId(student.id)}
                      >
                        <ListItemText
                          primary={`${name(student)} (${student.enrollmentNumber})`}
                          secondary={`${student.emailId || "No email"} · ${currentPlacement}`}
                        />
                      </ListItemButton>
                    );
                  })}
                </List>
              </Paper>
            ) : (
              <Typography color="text.secondary" sx={{ py: 1 }}>
                No eligible existing students found in this branch.
              </Typography>
            )}
            <TextField
              required
              name="enrollmentDate"
              label="Enrollment date"
              type="date"
              value={existingEnrollmentDate}
              onChange={(event) => setExistingEnrollmentDate(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>
        ) : (
          <Stack component="form" id="student-enrollment-form" spacing={2} onSubmit={submit} sx={{ pt: 1 }}>
            <Typography color="text.secondary">{group?.name}</Typography>
            {fields.map(([key, label]) => <TextField required key={key} name={key} label={label}
              type={key === "emailId" ? "email" : ["phoneNumber", "guardianContact"].includes(key) ? "tel" : "text"} />)}
            <TextField required name="enrollmentDate" label="Enrollment date" type="date"
              defaultValue={new Date().toLocaleDateString("en-CA")} slotProps={{ inputLabel: { shrink: true } }} />
          </Stack>
        )}
      </> : selected ? <Stack spacing={1}>
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
      {adding && (groupType === "batches" && addMode === "existing" ? (
        <Button variant="contained" form="existing-student-enrollment-form" type="submit" disabled={saving || !selectedExistingId}>
          Add to batch
        </Button>
      ) : (
        <Button variant="contained" form="student-enrollment-form" type="submit" disabled={saving}>
          Enroll student
        </Button>
      ))}
    </DialogActions>
    </Dialog>
  </BranchWorkspace>;
}
