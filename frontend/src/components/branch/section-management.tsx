"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, Typography,
} from "@mui/material";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import type { Role, Staff } from "@/types/domain";

export interface ClassSection {
  id: string;
  classId: string;
  sectionCode: string;
  capacity: number;
  status: number;
}

interface CreateSectionProps {
  base: string;
  classId: string;
  onClose: () => void;
  onCreated: (section: ClassSection) => void;
}

export function CreateSectionDialog({ base, classId, onClose, onCreated }: CreateSectionProps): ReactElement {
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (saving) return;
    if (!code.trim() || !Number.isInteger(Number(capacity)) || Number(capacity) < 1) {
      setError("Enter a section code and a positive whole-number capacity.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const section = await api<ClassSection>(`${base}/class-sections/create`, {
        method: "POST", body: JSON.stringify({ classId, sectionCode: code.trim(), capacity: Number(capacity) }),
      });
      onCreated(section);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not create section."));
    } finally {
      setSaving(false);
    }
  }

  return <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs" aria-labelledby="create-section-title">
    <DialogTitle id="create-section-title">Add section</DialogTitle>
    <form onSubmit={submit}>
      <DialogContent><Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField required label="Section code" value={code} onChange={event => setCode(event.target.value)} />
        <TextField required type="number" label="Capacity" value={capacity} slotProps={{ htmlInput: { min: 1, step: 1 } }}
          onChange={event => setCapacity(event.target.value)} />
      </Stack></DialogContent>
      <DialogActions><Button disabled={saving} onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={saving} type="submit">Create section</Button></DialogActions>
    </form>
  </Dialog>;
}

interface Subject { id: string; subjectName: string; subjectCode: string }
interface SectionSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  teacherUserId?: string | null;
  teacherFirstName?: string | null;
  teacherLastName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}
interface SectionSubjectMappingResponse {
  id: string;
  subjectId: string;
  teacherUserId?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}
interface TimeDraft {
  startTime: string;
  endTime: string;
}
interface Session { id: string; status: number; sessionName: string }
interface SubjectLists { branch: Subject[]; mapped: SectionSubject[] }
interface SectionSubjectsProps { orgId: string; branchId: string; section: ClassSection }

function formatTeacherName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function toTimeInput(value?: string | null): string {
  return value ? value.slice(0, 5) : "";
}

function buildTimeDrafts(mapped: SectionSubject[]): Record<string, TimeDraft> {
  return Object.fromEntries(
    mapped.map(item => [
      item.id,
      { startTime: toTimeInput(item.startTime), endTime: toTimeInput(item.endTime) },
    ]),
  );
}

export function SectionSubjects({ orgId, branchId, section }: SectionSubjectsProps): ReactElement {
  const base = `organisations/${orgId}/${branchId}`;
  const [session, setSession] = useState<Session | null>(null);
  const [lists, setLists] = useState<SubjectLists | null>(null);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [timeDrafts, setTimeDrafts] = useState<Record<string, TimeDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [addError, setAddError] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function load(): Promise<void> {
      try {
        const sessions = await api<Session[]>(`organisations/${orgId}/academic-sessions`);
        const current = sessions.find(item => item.status === 1);
        if (!active || !current) return;
        setSession(current);
        const [branch, mapped, roles] = await Promise.all([
          api<Subject[]>(`organisations/${orgId}/subjects?branchId=${branchId}`),
          api<SectionSubject[]>(`${base}/${current.id}/sections/${section.id}/subjects`),
          readApi<Role[]>("rbac/branch-roles", 30_000),
        ]);
        const teacherRole = roles.find(role => role.name === "teacher");
        const staffPage = teacherRole
          ? await api<{ items: Staff[] }>(
              `organisations/${orgId}/staff/page?branchId=${encodeURIComponent(branchId)}&roleId=${encodeURIComponent(teacherRole.id)}&page=1&pageSize=100`,
            )
          : { items: [] };
        if (active) {
          setLists({ branch, mapped });
          setTimeDrafts(buildTimeDrafts(mapped));
          setTeachers(staffPage.items.filter(member => member.status === 1));
        }
      } catch (reason) {
        if (active) setError(extractErrorMessage(reason, "Could not load section subjects."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [orgId, branchId, base, section.id]);

  const mappedIds = new Set(lists?.mapped.map(subject => subject.subjectId));
  const choices = lists?.branch.filter(subject => !mappedIds.has(subject.id)) ?? [];

  async function addSubject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const subject = choices.find(item => item.id === selected);
    if (!session || !lists || !subject || saving) return;
    setSaving(true);
    setAddError("");
    setError("");
    setNotice("");
    try {
      const mapping = await api<SectionSubjectMappingResponse>(`${base}/${session.id}/section-subjects/create`, {
        method: "POST", body: JSON.stringify({ sectionId: section.id, subjectId: subject.id }),
      });
      const added: SectionSubject = {
        id: mapping.id,
        subjectId: subject.id,
        subjectName: subject.subjectName,
        subjectCode: subject.subjectCode,
        teacherUserId: mapping.teacherUserId ?? null,
        teacherFirstName: null,
        teacherLastName: null,
        startTime: mapping.startTime ?? null,
        endTime: mapping.endTime ?? null,
      };
      setLists({ ...lists, mapped: [...lists.mapped, added] });
      setTimeDrafts(current => ({ ...current, [added.id]: { startTime: "", endTime: "" } }));
      setSelected("");
      setAddOpen(false);
      setNotice(`${subject.subjectName} added.`);
    } catch (reason) {
      setAddError(extractErrorMessage(reason, "Could not add subject."));
      // Reconcile a competing assignment or a response lost after a successful write.
      try {
        const mapped = await api<SectionSubject[]>(`${base}/${session.id}/sections/${section.id}/subjects`);
        setLists({ ...lists, mapped });
        setTimeDrafts(buildTimeDrafts(mapped));
        if (mapped.some(item => item.subjectId === selected)) {
          setSelected("");
          setAddOpen(false);
        }
      } catch { /* Keep the write error visible. */ }
    } finally {
      setSaving(false);
    }
  }

  async function updateTeacher(row: SectionSubject, nextTeacherUserId: string): Promise<void> {
    if (!session || !lists || updatingId) return;
    const teacherUserId = nextTeacherUserId || null;
    setUpdatingId(row.id);
    setError("");
    setNotice("");
    try {
      await api(`${base}/${session.id}/section-subjects/update/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ teacherUserId }),
      });
      const assigned = teacherUserId ? teachers.find(member => member.userId === teacherUserId) : undefined;
      setLists({
        ...lists,
        mapped: lists.mapped.map(item => (
          item.id === row.id
            ? {
                ...item,
                teacherUserId,
                teacherFirstName: assigned?.firstName ?? null,
                teacherLastName: assigned?.lastName ?? null,
              }
            : item
        )),
      });
      setNotice(
        assigned
          ? `${formatTeacherName(assigned.firstName, assigned.lastName)} assigned to ${row.subjectName}.`
          : `Teacher unassigned from ${row.subjectName}.`,
      );
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not update teacher."));
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateTime(row: SectionSubject, field: "startTime" | "endTime", value: string): Promise<void> {
    if (!session || !lists || updatingId) return;
    const previous = timeDrafts[row.id] ?? {
      startTime: toTimeInput(row.startTime),
      endTime: toTimeInput(row.endTime),
    };
    const nextDraft: TimeDraft = { ...previous, [field]: value };
    setTimeDrafts(current => ({ ...current, [row.id]: nextDraft }));
    setError("");
    setNotice("");

    const hasStart = Boolean(nextDraft.startTime);
    const hasEnd = Boolean(nextDraft.endTime);
    if (hasStart !== hasEnd) return;

    if (nextDraft.startTime && nextDraft.endTime && nextDraft.startTime >= nextDraft.endTime) {
      setError("Subject start time must be earlier than end time.");
      return;
    }

    const startTime = nextDraft.startTime || null;
    const endTime = nextDraft.endTime || null;
    setUpdatingId(row.id);
    try {
      await api(`${base}/${session.id}/section-subjects/update/${row.id}`, {
        method: "PUT",
        body: JSON.stringify({ startTime, endTime }),
      });
      setLists({
        ...lists,
        mapped: lists.mapped.map(item => (
          item.id === row.id ? { ...item, startTime, endTime } : item
        )),
      });
      setNotice(
        startTime && endTime
          ? `Schedule updated for ${row.subjectName} (${startTime} – ${endTime}).`
          : `Schedule cleared for ${row.subjectName}.`,
      );
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not update schedule."));
      setTimeDrafts(current => ({
        ...current,
        [row.id]: { startTime: toTimeInput(row.startTime), endTime: toTimeInput(row.endTime) },
      }));
    } finally {
      setUpdatingId(null);
    }
  }

  return <Stack spacing={2}>
    {error && <Alert severity="error">{error}</Alert>}
    {notice && <Alert severity="success">{notice}</Alert>}
    {loading && <CircularProgress size={24} aria-label="Loading subjects" />}
    {!loading && !error && !session && <Alert severity="info">An active academic session is required to add subjects.</Alert>}
    {lists && <>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        {session ? <Typography variant="subtitle1">{session.sessionName}</Typography> : <span />}
        <Button variant="contained" disabled={!session || !choices.length}
          onClick={() => { setSelected(""); setAddError(""); setAddOpen(true); }}>
          Add subject
        </Button>
      </Box>
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Table aria-label="Section subjects" sx={{ minWidth: 760 }}>
          <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700 } }}>
            <TableRow>
              <TableCell>Subject</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Teacher</TableCell>
              <TableCell>Start time</TableCell>
              <TableCell>End time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lists.mapped.map(row => {
              const currentTeacherName = formatTeacherName(row.teacherFirstName, row.teacherLastName);
              const hasFallbackTeacher = Boolean(
                row.teacherUserId && !teachers.some(teacher => teacher.userId === row.teacherUserId),
              );
              const draft = timeDrafts[row.id] ?? {
                startTime: toTimeInput(row.startTime),
                endTime: toTimeInput(row.endTime),
              };
              const invalidRange = Boolean(draft.startTime && draft.endTime && draft.startTime >= draft.endTime);
              return (
                <TableRow key={row.id} sx={{ "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" } }}>
                  <TableCell>{row.subjectName}</TableCell>
                  <TableCell>{row.subjectCode}</TableCell>
                  <TableCell sx={{ minWidth: 220 }}>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={row.teacherUserId ?? ""}
                      disabled={updatingId === row.id}
                      slotProps={{ select: { displayEmpty: true }, htmlInput: { "aria-label": `Teacher for ${row.subjectName}` } }}
                      onChange={event => void updateTeacher(row, event.target.value)}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {hasFallbackTeacher && (
                        <MenuItem value={row.teacherUserId ?? ""}>
                          {currentTeacherName || "Assigned teacher"}
                        </MenuItem>
                      )}
                      {teachers.map(teacher => (
                        <MenuItem key={teacher.userId} value={teacher.userId}>
                          {formatTeacherName(teacher.firstName, teacher.lastName)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell sx={{ minWidth: 145 }}>
                    <TextField
                      type="time"
                      size="small"
                      fullWidth
                      value={draft.startTime}
                      error={invalidRange}
                      disabled={updatingId === row.id}
                      slotProps={{ htmlInput: { "aria-label": `Start time for ${row.subjectName}` } }}
                      onChange={event => void updateTime(row, "startTime", event.target.value)}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 145 }}>
                    <TextField
                      type="time"
                      size="small"
                      fullWidth
                      value={draft.endTime}
                      error={invalidRange}
                      disabled={updatingId === row.id}
                      slotProps={{ htmlInput: { "aria-label": `End time for ${row.subjectName}` } }}
                      onChange={event => void updateTime(row, "endTime", event.target.value)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {!lists.mapped.length && (
              <TableRow>
                <TableCell colSpan={5}>No subjects assigned for this session.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {!choices.length && (
        <Typography variant="body2" color="text.secondary">
          {lists.branch.length ? "All branch subjects have been added." : "No subjects assigned to this branch."}
        </Typography>
      )}
    </>}
    <Dialog open={addOpen} onClose={saving ? undefined : () => setAddOpen(false)} fullWidth maxWidth="xs" aria-labelledby="add-section-subject-title">
      <DialogTitle id="add-section-subject-title">Add subject</DialogTitle>
      <form onSubmit={addSubject}>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            {addError && <Alert severity="error">{addError}</Alert>}
            <TextField select fullWidth required label="Branch subject" value={selected} disabled={saving}
              onChange={event => setSelected(event.target.value)}>
              {choices.map(subject => (
                <MenuItem key={subject.id} value={subject.id}>{subject.subjectName} ({subject.subjectCode})</MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={!selected || saving} type="submit">Add subject</Button>
        </DialogActions>
      </form>
    </Dialog>
  </Stack>;
}
