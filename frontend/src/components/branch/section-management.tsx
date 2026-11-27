"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { api, extractErrorMessage } from "@/lib/api";

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
interface Session { id: string; status: number; sessionName: string }
interface SubjectLists { branch: Subject[]; mapped: Subject[] }
interface SectionSubjectsProps { orgId: string; branchId: string; section: ClassSection }

export function SectionSubjects({ orgId, branchId, section }: SectionSubjectsProps): ReactElement {
  const base = `organisations/${orgId}/${branchId}`;
  const [session, setSession] = useState<Session | null>(null);
  const [lists, setLists] = useState<SubjectLists | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState("");
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
        const [branch, mapped] = await Promise.all([
          api<Subject[]>(`organisations/${orgId}/subjects?branchId=${branchId}`),
          api<Subject[]>(`${base}/${current.id}/sections/${section.id}/subjects`),
        ]);
        if (active) setLists({ branch, mapped });
      } catch (reason) {
        if (active) setError(extractErrorMessage(reason, "Could not load section subjects."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [orgId, branchId, base, section.id]);

  const mappedIds = new Set(lists?.mapped.map(subject => subject.id));
  const choices = lists?.branch.filter(subject => !mappedIds.has(subject.id)) ?? [];

  async function addSubject(): Promise<void> {
    const subject = choices.find(item => item.id === selected);
    if (!session || !lists || !subject || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api(`${base}/${session.id}/section-subjects/create`, {
        method: "POST", body: JSON.stringify({ sectionId: section.id, subjectId: subject.id }),
      });
      setLists({ ...lists, mapped: [...lists.mapped, subject] });
      setSelected("");
      setNotice(`${subject.subjectName} added.`);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not add subject."));
      // Reconcile a competing assignment or a response lost after a successful write.
      try {
        const mapped = await api<Subject[]>(`${base}/${session.id}/sections/${section.id}/subjects`);
        setLists({ ...lists, mapped });
        if (mapped.some(item => item.id === selected)) setSelected("");
      } catch { /* Keep the write error visible. */ }
    } finally {
      setSaving(false);
    }
  }

  return <Stack spacing={2} alignItems="flex-start">
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="success">{notice}</Alert>}
      {loading && <CircularProgress size={24} aria-label="Loading subjects" />}
      {!loading && !error && !session && <Alert severity="info">An active academic session is required to add subjects.</Alert>}
      {session && <Typography variant="subtitle1">{session.sessionName}</Typography>}
      {lists && <>
        {lists.mapped.length ? <ul>{lists.mapped.map(subject => <li key={subject.id}>{subject.subjectName} ({subject.subjectCode})</li>)}</ul>
          : <Typography>No subjects assigned for this session.</Typography>}
        {choices.length ? <TextField select fullWidth label="Branch subject" value={selected} disabled={saving}
          onChange={event => setSelected(event.target.value)}>
          {choices.map(subject => <MenuItem key={subject.id} value={subject.id}>{subject.subjectName} ({subject.subjectCode})</MenuItem>)}
        </TextField> : <Typography>{lists.branch.length ? "All branch subjects have been added." : "No subjects assigned to this branch."}</Typography>}
      </>}
    <Button variant="contained" onClick={() => void addSubject()} disabled={!selected || saving}>Add subject</Button>
  </Stack>;
}
