"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { type ReactElement, useEffect, useState } from "react";
import { Alert, Box, Breadcrumbs, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Link as MuiLink, ListItem, List, ListItemButton, MenuItem, Snackbar, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, ListItemText, Paper, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateSectionDialog, type ClassSection } from "./section-management";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { readBranchClasses, readBranchIdentity, type BranchClass, type BranchSummary } from "./branch-data";
import { PageHeader } from "@/components/common/page-header";
import { api, extractErrorMessage, readApi } from "@/lib/api";
import { useActiveContextQuery } from "@/lib/active-context";



interface AcademicSession { id: string; sessionName?: string; name?: string; status?: number }
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
  academicSessionId: string;
  batchCode: string;
  batchName: string;
  startDate: string;
  endDate: string;
  capacity: string;
  dailyStartTime: string;
  dailyEndTime: string;
}

interface ClassStudentItem {
  id: string;
  userId: string;
  enrollmentNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  emailId: string | null;
  phoneNumber: string | null;
  classId: string;
  className: string;
  batchId: string | null;
  batchName: string | null;
  sectionId: string | null;
  sectionCode: string | null;
}

interface ClassStudentPage {
  items: ClassStudentItem[];
  total: number;
  page: number;
  pageSize: number;
}

interface StudentEditFormState {
  classId: string;
  batchId: string;
  sectionId: string;
}

function studentFullName(student: Pick<ClassStudentItem, "firstName" | "middleName" | "lastName">): string {
  return [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
}

const emptyBatchForm: BatchFormState = {
  academicSessionId: "",
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

function sessionLabel(session: AcademicSession): string {
  const base = session.sessionName?.trim() || session.name?.trim() || session.id;
  if (session.status === undefined) return base;
  return `${base} (${session.status === 1 ? "Active" : "Inactive"})`;
}

export function BranchClassDetailsPage({ orgId, branchId, classId }: { orgId: string; branchId: string; classId: string }): ReactElement {
  const router = useRouter();
  const contextQuery = useActiveContextQuery();
  const [sessionId, setSessionId] = useState("");
  const [branch, setBranch] = useState<BranchSummary["branch"] | null>(null);
  const [classItem, setClassItem] = useState<BranchClass | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[] | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [addingSection, setAddingSection] = useState(false);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [batches, setBatches] = useState<ClassBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [relationError, setRelationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ClassBatch | null>(null);
  const [batchForm, setBatchForm] = useState<BatchFormState>(emptyBatchForm);
  const [batchFormError, setBatchFormError] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<"groups" | "students">("groups");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const [studentsData, setStudentsData] = useState<ClassStudentPage | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentsRevision, setStudentsRevision] = useState(0);
  const [branchClasses, setBranchClasses] = useState<BranchClass[]>([]);
  const [editingStudent, setEditingStudent] = useState<ClassStudentItem | null>(null);
  const [studentForm, setStudentForm] = useState<StudentEditFormState>({
    classId: "",
    batchId: "",
    sectionId: "",
  });
  const [targetBatches, setTargetBatches] = useState<ClassBatch[]>([]);
  const [targetSections, setTargetSections] = useState<ClassSection[]>([]);
  const [targetGroupsLoading, setTargetGroupsLoading] = useState(false);
  const [studentFormError, setStudentFormError] = useState<string | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);

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
    void loadClass();
    return () => { active = false; };
  }, [orgId, branchId, classId]);

  const needsSessions = branch && (branch.type !== 1 || activeTab === "students");
  useEffect(() => {
    if (!needsSessions) return;
    let active = true;
    setSessionError(null);
    void readApi<AcademicSession[]>(`organisations/${orgId}/academic-sessions`, 30_000)
      .then((data) => { if (active) setSessions(data); })
      .catch((reason: unknown) => {
        if (active) setSessionError(extractErrorMessage(reason, "Could not load academic sessions."));
      });
    return () => { active = false; };
  }, [orgId, needsSessions]);

  useEffect(() => {
    if (!branch || !classItem || (branch.type !== 1 && !sessions)) return;
    let active = true;
    const loadRelations = async (): Promise<void> => {
      try {
        const base = `organisations/${orgId}/${branchId}`;
        const query = `classId=${encodeURIComponent(classId)}`;
        if (branch.type === 1) {
          const rows = await readApi<ClassSection[]>(`${base}/class-sections?${query}`, 30_000);
          if (active) setSections(rows);
        } else {
          const session = sessions?.find(item => item.id === sessionId)
            ?? sessions?.find(item => item.status === 1)
            ?? sessions?.[0];
          const rows = session
            ? await readApi<ClassBatch[]>(`${base}/${session.id}/class-batches?${query}`, 30_000)
            : [];
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
  const activeOrgSession = sessions?.find(item => item.status === 1);
  const selectedSession = sessions?.find(item => item.id === sessionId)
    ?? activeOrgSession
    ?? sessions?.[0];
  const activeSessionId = selectedSession?.id ?? "";
  const isSelectedSessionActive = selectedSession?.status === undefined || selectedSession.status === 1;
  const formSession = sessions?.find(item => item.id === batchForm.academicSessionId);
  const isFormSessionActive = formSession ? (formSession.status === undefined || formSession.status === 1) : false;

  useEffect(() => {
    if (activeTab !== "students" || !branch || !classItem) return;
    let active = true;
    const params = new URLSearchParams({
      page: String(studentPage),
      pageSize: String(studentPageSize),
      classId,
    });
    if (studentSearch.trim()) params.set("search", studentSearch.trim());
    setStudentsLoading(true);
    setStudentsError(null);
    readApi<ClassStudentPage>(`organisations/${orgId}/branches/${branchId}/students?${params}`)
      .then((data) => {
        if (active) setStudentsData(data);
      })
      .catch((reason: unknown) => {
        if (active) setStudentsError(extractErrorMessage(reason, "Could not load students for this class."));
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });
    return () => { active = false; };
  }, [activeTab, branch, classItem, orgId, branchId, classId, studentPage, studentPageSize, studentSearch, studentsRevision]);

  useEffect(() => {
    if (!editingStudent || !branch) return;
    let active = true;
    readBranchClasses(orgId, branchId)
      .then((list) => {
        if (active) setBranchClasses(list);
      })
      .catch(() => {
        if (active) setBranchClasses([]);
      });
    return () => { active = false; };
  }, [editingStudent, branch, orgId, branchId]);

  useEffect(() => {
    if (!editingStudent || !branch || !activeOrgSession || !studentForm.classId) return;
    let active = true;
    const base = `organisations/${orgId}/${branchId}`;
    setTargetGroupsLoading(true);
    if (branch.type === 1) {
      readApi<ClassSection[]>(`${base}/class-sections?classId=${encodeURIComponent(studentForm.classId)}`, 30_000)
        .then((rows) => {
          if (!active) return;
          setTargetSections(rows);
          setTargetBatches([]);
          setStudentForm((current) => ({
            ...current,
            sectionId: rows.some((row) => row.id === current.sectionId) ? current.sectionId : (rows[0]?.id ?? ""),
            batchId: "",
          }));
        })
        .catch((reason: unknown) => {
          if (active) setStudentFormError(extractErrorMessage(reason, "Could not load sections for the selected class."));
        })
        .finally(() => {
          if (active) setTargetGroupsLoading(false);
        });
    } else {
      readApi<ClassBatch[]>(`${base}/${activeOrgSession.id}/class-batches?classId=${encodeURIComponent(studentForm.classId)}`, 30_000)
        .then((rows) => {
          if (!active) return;
          setTargetBatches(rows);
          setTargetSections([]);
          setStudentForm((current) => ({
            ...current,
            batchId: rows.some((row) => row.id === current.batchId) ? current.batchId : (rows[0]?.id ?? ""),
            sectionId: "",
          }));
        })
        .catch((reason: unknown) => {
          if (active) setStudentFormError(extractErrorMessage(reason, "Could not load batches for the selected class."));
        })
        .finally(() => {
          if (active) setTargetGroupsLoading(false);
        });
    }
    return () => { active = false; };
  }, [editingStudent, branch, activeOrgSession, orgId, branchId, studentForm.classId]);

  const openStudentDialog = (student: ClassStudentItem): void => {
    setEditingStudent(student);
    setStudentForm({
      classId: student.classId,
      batchId: student.batchId ?? "",
      sectionId: student.sectionId ?? "",
    });
    setStudentFormError(null);
  };

  const saveStudent = async (): Promise<void> => {
    if (!editingStudent) return;
    if (!activeOrgSession) {
      setStudentFormError("An active academic session is required to update a student.");
      return;
    }
    if (!studentForm.classId) {
      setStudentFormError("Class is required.");
      return;
    }
    if (isSchool ? !studentForm.sectionId : !studentForm.batchId) {
      setStudentFormError(isSchool ? "Choose a section for this student." : "Choose a batch for this student.");
      return;
    }

    setSavingStudent(true);
    setStudentFormError(null);
    try {
      await api(`organisations/${orgId}/branches/${branchId}/students/${editingStudent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          classId: studentForm.classId,
          academicSessionId: activeOrgSession.id,
          ...(isSchool ? { sectionId: studentForm.sectionId } : { batchId: studentForm.batchId }),
        }),
      });
      setEditingStudent(null);
      setStudentsRevision((value) => value + 1);
      setNotice("Student updated.");
    } catch (reason) {
      setStudentFormError(extractErrorMessage(reason, "Could not update student."));
    } finally {
      setSavingStudent(false);
    }
  };

  const openBatchDialog = (batch?: ClassBatch): void => {
    setEditingBatch(batch ?? null);
    setBatchForm(batch ? {
      academicSessionId: batch.academicSessionId,
      batchCode: batch.batchCode,
      batchName: batch.batchName ?? "",
      startDate: formatDateLabel(batch.startDate) ?? "",
      endDate: formatDateLabel(batch.endDate) ?? "",
      capacity: String(batch.capacity),
      dailyStartTime: batch.dailyStartTime ?? "",
      dailyEndTime: batch.dailyEndTime ?? "",
    } : {
      ...emptyBatchForm,
      academicSessionId: activeSessionId,
    });
    setBatchFormError(null);
    setBatchDialogOpen(true);
  };

  const saveBatch = async (): Promise<void> => {
    const targetSessionId = editingBatch ? editingBatch.academicSessionId : batchForm.academicSessionId;
    if (!targetSessionId) {
      setBatchFormError("An academic session is required before saving a batch.");
      return;
    }
    const targetSession = sessions?.find((item) => item.id === targetSessionId);
    if (targetSession && targetSession.status !== undefined && targetSession.status !== 1) {
      setBatchFormError("Changes can only be made for the active academic session.");
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
        ...(editingBatch ? {} : { classId }),
        batchCode,
        batchName: batchForm.batchName.trim() || null,
        startDate: batchForm.startDate,
        endDate: batchForm.endDate,
        capacity,
        ...(batchForm.dailyStartTime ? { dailyStartTime: batchForm.dailyStartTime } : {}),
        ...(batchForm.dailyEndTime ? { dailyEndTime: batchForm.dailyEndTime } : {}),
      };
      if (editingBatch) {
        const updated = await api<ClassBatch>(
          `organisations/${orgId}/${branchId}/${targetSessionId}/class-batches/update/${editingBatch.id}`,
          { method: "PUT", body: JSON.stringify(payload) },
        );
        setBatches((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        setBatchDialogOpen(false);
        setNotice("Batch updated.");
      } else {
        const created = await api<ClassBatch>(
          `organisations/${orgId}/${branchId}/${targetSessionId}/class-batches/create`,
          { method: "POST", body: JSON.stringify(payload) },
        );
        if (targetSessionId === activeSessionId) {
          setBatches((current) => [created, ...current]);
        }
        setBatchDialogOpen(false);
        setNotice("Batch created.");
      }
    } catch (reason) {
      setBatchFormError(extractErrorMessage(reason, editingBatch ? "Could not update batch." : "Could not create batch."));
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
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_, nextTab: "groups" | "students") => setActiveTab(nextTab)}
              aria-label="Class sections and students"
            >
              <Tab label={relationName} value="groups" />
              <Tab label="Students" value="students" />
            </Tabs>
          </Box>
          {activeTab === "groups" ? (
            <>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight={700}>{relationName}</Typography>
                {isSchool ? (
                  <Button variant="contained" size="small" disabled={relationsLoading} onClick={() => setAddingSection(true)}>Add section</Button>
                ) : (
                  <Button variant="contained" size="small" disabled={relationsLoading || !activeSessionId || !isSelectedSessionActive} onClick={() => openBatchDialog()}>
                    Add batch
                  </Button>
                )}
              </Stack>
              {!isSchool && sessions && sessions.length > 0 && (
                <TextField
                  select
                  size="small"
                  label="Academic session"
                  sx={{ my: 2, minWidth: 240 }}
                  value={activeSessionId}
                  onChange={(event) => {
                    setRelationsLoading(true);
                    setRelationError(null);
                    setSessionId(event.target.value);
                  }}
                >
                  {sessions.map((session) => (
                    <MenuItem key={session.id} value={session.id}>{sessionLabel(session)}</MenuItem>
                  ))}
                </TextField>
              )}
              {!isSchool && sessions && sessions.length === 0 && (
                <Alert severity="info" sx={{ my: 2 }}>
                  No academic sessions have been created for this organisation yet.
                </Alert>
              )}
              {!isSchool && selectedSession && !isSelectedSessionActive && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Viewing an inactive academic session. You can browse records, but adding or updating data is only allowed in the active academic session.
                </Alert>
              )}
              {(!isSchool && sessionError) || relationError ? <Alert severity="error">{(!isSchool && sessionError) || relationError}</Alert> : relationsLoading ? <CircularProgress size={24} /> : isSchool ? sections.length ? <List disablePadding>{sections.map(section => (
                <ListItem key={section.id} divider disablePadding>
                  <ListItemButton component={Link} href={`/classes/${classId}/sections/${section.id}${contextQuery}`}>
                    <ListItemText primary={`Section ${section.sectionCode}`} secondary={`Capacity: ${section.capacity} · ${section.status === 1 ? "Active" : "Inactive"}`} />
                  </ListItemButton>
                </ListItem>
              ))}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No sections are linked to this class yet.</Typography> : batches.length ? (
                <TableContainer sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: 2, overflowX: "auto" }}>
                  <Table aria-label="Batches" sx={{ minWidth: 620 }}>
                    <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700, borderBottom: "1px solid", borderColor: "grey.300" } }}>
                      <TableRow>
                        <TableCell scope="col">Batch name</TableCell>
                        <TableCell scope="col">Batch code</TableCell>
                        <TableCell scope="col">Start date</TableCell>
                        <TableCell scope="col">End date</TableCell>
                        <TableCell scope="col">Capacity</TableCell>
                        <TableCell scope="col" align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {batches.map((batch) => {
                        const batchHref = `/classes/${classId}/batches/${batch.id}/students${contextQuery}`;
                        const batchName = batch.batchName?.trim() || "";
                        const start = formatDateLabel(batch.startDate) ?? "—";
                        const end = formatDateLabel(batch.endDate) ?? "—";
                        return (
                          <TableRow
                            hover
                            key={batch.id}
                            onClick={() => router.push(batchHref)}
                            sx={{
                              cursor: "pointer",
                              "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" },
                              "&:last-child > td": { borderBottom: 0 },
                            }}
                          >
                            <TableCell>
                              {batchName ? (
                                <MuiLink
                                  component={Link}
                                  href={batchHref}
                                  underline="hover"
                                  sx={{ fontWeight: 600 }}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {batchName}
                                </MuiLink>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {batchName ? (
                                batch.batchCode
                              ) : (
                                <MuiLink
                                  component={Link}
                                  href={batchHref}
                                  underline="hover"
                                  sx={{ fontWeight: 600 }}
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {batch.batchCode}
                                </MuiLink>
                              )}
                            </TableCell>
                            <TableCell>{start}</TableCell>
                            <TableCell>{end}</TableCell>
                            <TableCell>{batch.capacity}</TableCell>
                            <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                              <Button size="small" disabled={!isSelectedSessionActive} onClick={() => openBatchDialog(batch)}>
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary" sx={{ py: 3 }}>No batches are linked to this class yet.</Typography>
              )}
            </>
          ) : (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
                <Typography variant="h6" fontWeight={700}>Students</Typography>
                <TextField
                  size="small"
                  label="Search students"
                  placeholder="Name, email, or enrollment number"
                  value={studentSearch}
                  onChange={(event) => {
                    setStudentSearch(event.target.value);
                    setStudentPage(1);
                  }}
                  sx={{ minWidth: { xs: "100%", sm: 280 } }}
                />
              </Stack>
              {sessionError && <Alert severity="error">{sessionError}</Alert>}
              {!activeOrgSession && sessions && (
                <Alert severity="info">
                  No active academic session found. Moving or updating students is only allowed in an active academic session.
                </Alert>
              )}
              {studentsError ? (
                <Alert severity="error">{studentsError}</Alert>
              ) : studentsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={24} aria-label="Loading students" />
                </Box>
              ) : (
                <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
                  <TableContainer>
                    <Table aria-label="Class students" sx={{ minWidth: 680 }}>
                      <TableHead sx={{ bgcolor: "action.hover", "& th": { fontWeight: 700 } }}>
                        <TableRow>
                          <TableCell scope="col">Student name</TableCell>
                          <TableCell scope="col">Enrollment number</TableCell>
                          <TableCell scope="col">Email</TableCell>
                          <TableCell scope="col">Phone number</TableCell>
                          <TableCell scope="col">{isSchool ? "Section" : "Batch"}</TableCell>
                          <TableCell scope="col" align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {studentsData?.items.map((student) => (
                          <TableRow
                            hover
                            key={student.id}
                            sx={{ "& > td": { py: 1.5, borderBottom: "1px solid", borderColor: "grey.300" } }}
                          >
                            <TableCell sx={{ fontWeight: 600 }}>{studentFullName(student)}</TableCell>
                            <TableCell>{student.enrollmentNumber}</TableCell>
                            <TableCell>{student.emailId || "—"}</TableCell>
                            <TableCell>{student.phoneNumber || "—"}</TableCell>
                            <TableCell>
                              {isSchool
                                ? (student.sectionCode ? `Section ${student.sectionCode}` : "—")
                                : (student.batchName || "—")}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                disabled={!activeOrgSession}
                                onClick={() => openStudentDialog(student)}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!studentsData?.items.length && (
                          <TableRow>
                            <TableCell colSpan={6}>No active students found in this class.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {studentsData && (
                    <TablePagination
                      component="div"
                      count={studentsData.total}
                      page={studentsData.page - 1}
                      rowsPerPage={studentsData.pageSize}
                      rowsPerPageOptions={Array.from(new Set([5, 10, 25, 50, studentsData.pageSize])).sort((a, b) => a - b)}
                      onPageChange={(_, index) => setStudentPage(index + 1)}
                      onRowsPerPageChange={(event) => {
                        setStudentPage(1);
                        setStudentPageSize(Number(event.target.value));
                      }}
                    />
                  )}
                </Paper>
              )}
            </Stack>
          )}
        </Paper>
      </>}
      {addingSection && <CreateSectionDialog base={`organisations/${orgId}/${branchId}`} classId={classId}
        onClose={() => setAddingSection(false)} onCreated={section => {
          setSections(current => [section, ...current]);
          setAddingSection(false);
          setNotice(`Section ${section.sectionCode} created.`);
        }} />}
      <Dialog open={batchDialogOpen} onClose={() => !savingBatch && setBatchDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingBatch ? "Update batch" : "Create batch"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {batchFormError && <Alert severity="error">{batchFormError}</Alert>}
            {!editingBatch && sessions && sessions.length > 0 && (
              <TextField
                select
                required
                label="Academic session"
                value={batchForm.academicSessionId}
                onChange={(event) => setBatchForm({ ...batchForm, academicSessionId: event.target.value })}
              >
                {sessions.map((session) => (
                  <MenuItem key={session.id} value={session.id}>{sessionLabel(session)}</MenuItem>
                ))}
              </TextField>
            )}
            {!editingBatch && formSession && !isFormSessionActive && (
              <Alert severity="warning">
                Selected session is inactive. Changes can only be made for the active academic session.
              </Alert>
            )}
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
            onClick={() => void saveBatch()}
            disabled={
              savingBatch ||
              (!editingBatch && !isFormSessionActive) ||
              !batchForm.batchCode.trim() ||
              !batchForm.startDate ||
              !batchForm.endDate ||
              Number(batchForm.capacity) < 1
            }
          >
            {editingBatch ? "Save changes" : "Create batch"}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={Boolean(editingStudent)} onClose={() => !savingStudent && setEditingStudent(null)} fullWidth maxWidth="sm" aria-labelledby="update-student-dialog-title">
        <DialogTitle id="update-student-dialog-title">Update student</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {studentFormError && <Alert severity="error">{studentFormError}</Alert>}
            {editingStudent && (
              <Box>
                <Typography fontWeight={600}>{studentFullName(editingStudent)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Enrollment number: {editingStudent.enrollmentNumber}
                </Typography>
              </Box>
            )}
            <TextField
              select
              required
              label="Class"
              value={studentForm.classId}
              onChange={(event) => {
                setStudentFormError(null);
                setStudentForm({ ...studentForm, classId: event.target.value, batchId: "", sectionId: "" });
              }}
            >
              {branchClasses.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.className} ({item.classCode})</MenuItem>
              ))}
            </TextField>
            {isSchool ? (
              <TextField
                select
                required
                label="Section"
                value={studentForm.sectionId}
                disabled={targetGroupsLoading || !targetSections.length}
                helperText={!targetGroupsLoading && !targetSections.length ? "No sections available for this class." : undefined}
                onChange={(event) => setStudentForm({ ...studentForm, sectionId: event.target.value })}
              >
                {targetSections.map((section) => (
                  <MenuItem key={section.id} value={section.id}>Section {section.sectionCode}</MenuItem>
                ))}
              </TextField>
            ) : (
              <TextField
                select
                required
                label="Batch"
                value={studentForm.batchId}
                disabled={targetGroupsLoading || !targetBatches.length}
                helperText={!targetGroupsLoading && !targetBatches.length ? "No batches available in the active session for this class." : undefined}
                onChange={(event) => setStudentForm({ ...studentForm, batchId: event.target.value })}
              >
                {targetBatches.map((batch) => (
                  <MenuItem key={batch.id} value={batch.id}>
                    {batch.batchName?.trim() ? `${batch.batchName} (${batch.batchCode})` : batch.batchCode}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingStudent(null)} disabled={savingStudent}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => void saveStudent()}
            disabled={
              savingStudent ||
              targetGroupsLoading ||
              !studentForm.classId ||
              (isSchool ? !studentForm.sectionId : !studentForm.batchId)
            }
          >
            Save changes
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
  </BranchWorkspace>;
}
