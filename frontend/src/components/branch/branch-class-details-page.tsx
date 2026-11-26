"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { type ReactElement, useEffect, useState } from "react";
import { Alert, Breadcrumbs, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, List, ListItemButton, MenuItem, Snackbar, Stack, TextField, ListItemText, Paper, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { readBranchClasses, readBranchIdentity, type BranchClass, type BranchSummary } from "./branch-data";
import { PageHeader } from "@/components/common/page-header";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import { useActiveContextQuery } from "@/lib/active-context";



interface AcademicSession { id: string; sessionName?: string; name?: string; status?: number }
interface ClassSection { id: string; academicSessionId: string; classId: string; sectionCode: string; capacity: number; status: number }
interface ClassBatch {
  id: string;
  academicSessionId: string;
  classId: string;
  batchCode: string;
  batchName?: string | null;
  startDate?: string;
  endDate?: string;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  capacity: number;
  status?: number;
}
interface BatchFormState {
  batchCode: string;
  batchName: string;
  startDate: string;
  endDate: string;
  capacity: string;
  dailyStartTime: string;
  dailyEndTime: string;
}

const emptyBatchForm: BatchFormState = {
  batchCode: "",
  batchName: "",
  startDate: "",
  endDate: "",
  capacity: "40",
  dailyStartTime: "",
  dailyEndTime: "",
};

function formatDateLabel(value?: string): string | null {
  if (!value) return null;
  return value.length >= 10 ? value.slice(0, 10) : value;
}

export function BranchClassDetailsPage({ orgId, branchId, classId }: { orgId: string; branchId: string; classId: string }): ReactElement {
  const contextQuery = useActiveContextQuery();
  const [sessionId, setSessionId] = useState("");
  const [branch, setBranch] = useState<BranchSummary["branch"] | null>(null);
  const [classItem, setClassItem] = useState<BranchClass | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[] | null>(null);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [batches, setBatches] = useState<ClassBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [relationError, setRelationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchForm, setBatchForm] = useState<BatchFormState>(emptyBatchForm);
  const [batchFormError, setBatchFormError] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const loadClass = async (): Promise<void> => {
      try {
        const [identity, classes] = await Promise.all([
          readBranchIdentity(orgId, branchId),
          readBranchClasses(orgId, branchId, classId),
        ]);
        if (!active) return;
        const selected = classes.find((item) => item.id === classId);
        if (!selected) throw new Error("This class is not assigned to the branch.");
        setBranch(identity);
        setClassItem(selected);
      } catch (reason) {
        if (active) setError(extractErrorMessage(reason, "Could not load class details."));
      } finally {
        if (active) setLoading(false);
      }
    };
    void readApi<AcademicSession[]>(`organisations/${orgId}/academic-sessions`, 30_000)
      .then((data) => { if (active) setSessions(data); })
      .catch((reason: unknown) => {
        if (active) setRelationError(extractErrorMessage(reason, "Could not load academic sessions."));
      });
    void loadClass();
    return () => { active = false; };
  }, [orgId, branchId, classId]);

  useEffect(() => {
    if (!branch || !classItem || !sessions) return;
    let active = true;
    const loadRelations = async (): Promise<void> => {
      try {
        const session = sessions.find(item => item.id === sessionId) ?? sessions[0];
        if (!session) return;
        const base = `organisations/${orgId}/${branchId}/${session.id}`;
        if (branch.type === 1) {
          const rows = await readApi<ClassSection[]>(`${base}/class-sections?classId=${encodeURIComponent(classId)}`, 30_000);
          if (active) setSections(rows);
        } else {
          const rows = await readApi<ClassBatch[]>(`${base}/class-batches?classId=${encodeURIComponent(classId)}`, 30_000);
          if (active) setBatches(rows);
        }
      } catch (reason) {
        if (active) setRelationError(extractErrorMessage(reason, "Could not load class groups."));
      } finally {
        if (active) setRelationsLoading(false);
      }
    };
    void loadRelations();
    return () => { active = false; };
  }, [branch, classItem, sessions, sessionId, orgId, branchId, classId]);

  const isSchool = branch?.type === 1;
  const relationName = isSchool ? "Sections" : "Batches";
  const activeSessionId = (sessions?.find(item => item.id === sessionId) ?? sessions?.[0])?.id ?? "";

  const openBatchDialog = (): void => {
    setBatchForm(emptyBatchForm);
    setBatchFormError(null);
    setBatchDialogOpen(true);
  };

  const createBatch = async (): Promise<void> => {
    if (!activeSessionId) {
      setBatchFormError("An academic session is required before creating a batch.");
      return;
    }
    const batchCode = batchForm.batchCode.trim();
    const capacity = Number(batchForm.capacity);
    if (!batchCode || !batchForm.startDate || !batchForm.endDate || !Number.isInteger(capacity) || capacity < 1) {
      setBatchFormError("Batch code, start date, end date, and a valid capacity are required.");
      return;
    }
    if (batchForm.endDate < batchForm.startDate) {
      setBatchFormError("End date must be on or after start date.");
      return;
    }

    setSavingBatch(true);
    setBatchFormError(null);
    try {
      const payload = {
        classId,
        batchCode,
        batchName: batchForm.batchName.trim() || null,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate,
        capacity,
        ...(batchForm.dailyStartTime ? { dailyStartTime: batchForm.dailyStartTime } : {}),
        ...(batchForm.dailyEndTime ? { dailyEndTime: batchForm.dailyEndTime } : {}),
      };
      const created = await api<ClassBatch>(
        `organisations/${orgId}/${branchId}/${activeSessionId}/class-batches/create`,
        { method: "POST", body: JSON.stringify(payload) },
      );
      setBatches((current) => [created, ...current]);
      setBatchDialogOpen(false);
      setNotice("Batch created.");
    } catch (reason) {
      setBatchFormError(extractErrorMessage(reason, "Could not create batch."));
    } finally {
      setSavingBatch(false);
    }
  };

  return <BranchWorkspace>
      <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 2 }}><MuiLink component={Link} href={`/dashboard${contextQuery}`} underline="hover" color="inherit">Dashboard</MuiLink><MuiLink component={Link} href={`/classes${contextQuery}`} underline="hover" color="inherit">Classes</MuiLink><Typography color="text.primary">{classItem?.className ?? "Class details"}</Typography></Breadcrumbs>
      <Button component={Link} href={`/classes${contextQuery}`} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Classes
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <PanelLoading padding={12} /> : classItem && <>
        <PageHeader title={classItem.className} subtitle={`Class code: ${classItem.classCode}`} />
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px", mb: 3 }}><Typography variant="h6" fontWeight={700}>Class details</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{classItem.description || "No description provided."}</Typography></Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
            <Typography variant="h6" fontWeight={700}>{relationName}</Typography>
            {!isSchool && (
              <Button variant="contained" size="small" disabled={relationsLoading || !activeSessionId} onClick={openBatchDialog}>
                Add batch
              </Button>
            )}
          </Stack>
          {sessions && sessions.length > 1 && <TextField select size="small" label="Academic session" sx={{ my: 2, minWidth: 180 }} value={sessionId || sessions[0].id} onChange={event => {
              setRelationsLoading(true);
              setRelationError(null);
              setSessionId(event.target.value);
            }}>{sessions.map(session => <MenuItem key={session.id} value={session.id}>{session.sessionName || session.name || session.id}</MenuItem>)}</TextField>}
          {relationError ? <Alert severity="error">{relationError}</Alert> : relationsLoading ? <CircularProgress size={24} /> : isSchool ? sections.length ? <List disablePadding>{sections.map((section) => <ListItemButton key={section.id} divider component={Link} href={`/classes/${classId}/sections/${section.id}/students${contextQuery}`}><ListItemText primary={`Section ${section.sectionCode}`} secondary={`Capacity: ${section.capacity} · ${section.status === 1 ? "Active" : "Inactive"}`} /></ListItemButton>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No sections are linked to this class yet.</Typography> : batches.length ? <List disablePadding>{batches.map((batch) => {
            const start = formatDateLabel(batch.startDate);
            const end = formatDateLabel(batch.endDate);
            const dateRange = start && end ? `${start} to ${end} · ` : "";
            return <ListItemButton key={batch.id} divider component={Link} href={`/classes/${classId}/batches/${batch.id}/students${contextQuery}`}><ListItemText primary={batch.batchName || batch.batchCode} secondary={`${batch.batchName ? `Batch code: ${batch.batchCode} · ` : ""}${dateRange}Capacity: ${batch.capacity}`} /></ListItemButton>;
          })}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No batches are linked to this class yet.</Typography>}
        </Paper>
      </>}
      <Dialog open={batchDialogOpen} onClose={() => !savingBatch && setBatchDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create batch</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {batchFormError && <Alert severity="error">{batchFormError}</Alert>}
            <TextField
              required
              label="Batch code"
              value={batchForm.batchCode}
              onChange={(event) => setBatchForm({ ...batchForm, batchCode: event.target.value })}
            />
            <TextField
              label="Batch name"
              value={batchForm.batchName}
              onChange={(event) => setBatchForm({ ...batchForm, batchName: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                required
                fullWidth
                type="date"
                label="Start date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={batchForm.startDate}
                onChange={(event) => setBatchForm({ ...batchForm, startDate: event.target.value })}
              />
              <TextField
                required
                fullWidth
                type="date"
                label="End date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={batchForm.endDate}
                onChange={(event) => setBatchForm({ ...batchForm, endDate: event.target.value })}
              />
            </Stack>
            <TextField
              required
              type="number"
              label="Capacity"
              slotProps={{ htmlInput: { min: 1 } }}
              value={batchForm.capacity}
              onChange={(event) => setBatchForm({ ...batchForm, capacity: event.target.value })}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="time"
                label="Daily start time"
                slotProps={{ inputLabel: { shrink: true } }}
                value={batchForm.dailyStartTime}
                onChange={(event) => setBatchForm({ ...batchForm, dailyStartTime: event.target.value })}
              />
              <TextField
                fullWidth
                type="time"
                label="Daily end time"
                slotProps={{ inputLabel: { shrink: true } }}
                value={batchForm.dailyEndTime}
                onChange={(event) => setBatchForm({ ...batchForm, dailyEndTime: event.target.value })}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchDialogOpen(false)} disabled={savingBatch}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void createBatch()}
            disabled={savingBatch || !batchForm.batchCode.trim() || !batchForm.startDate || !batchForm.endDate || Number(batchForm.capacity) < 1}
          >
            Create batch
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
  </BranchWorkspace>;
}
