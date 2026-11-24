"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { useEffect, useState } from "react";
import { Alert, Breadcrumbs, Button, CircularProgress, Link as MuiLink, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { readBranchClasses, readBranchIdentity, type BranchClass, type BranchSummary } from "./branch-data";
import { ProfileLink } from "@/components/profile-link";
import { PageHeader } from "@/components/common/page-header";
import { extractErrorMessage, readApi } from "@/lib/api";

interface AcademicSession { id: string; sessionName?: string; name?: string; status?: number }
interface ClassSection { id: string; classId: string; sectionCode: string; capacity: number; status: number }
interface ClassBatch { id: string; classId: string; batchCode: string; batchName?: string | null; capacity: number; status?: number }

export function BranchClassDetailsPage({ orgId, branchId, classId, email }: { orgId: string; branchId: string; classId: string; email?: string }) {
  const [branch, setBranch] = useState<BranchSummary["branch"] | null>(null);
  const [classItem, setClassItem] = useState<BranchClass | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[] | null>(null);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [batches, setBatches] = useState<ClassBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationsLoading, setRelationsLoading] = useState(true);
  const [relationError, setRelationError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        const session = sessions[0];
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
  }, [branch, classItem, sessions, orgId, branchId, classId]);

  const isSchool = branch?.type === 1;
  const relationName = isSchool ? "Sections" : "Batches";
  return <BranchWorkspace active="Classes" email={email}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}><Breadcrumbs aria-label="Breadcrumb"><MuiLink component={Link} href="/dashboard" underline="hover" color="inherit">Dashboard</MuiLink><MuiLink component={Link} href="/dashboard/branch/classes" underline="hover" color="inherit">Classes</MuiLink><Typography color="text.primary">{classItem?.className ?? "Class details"}</Typography></Breadcrumbs><ProfileLink email={email} /></Stack>
      <Button component={Link} href="/dashboard/branch/classes" startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        Back to Classes
      </Button>
      {error && <Alert severity="error">{error}</Alert>}
      {loading ? <PanelLoading padding={12} /> : classItem && <>
        <PageHeader title={classItem.className} subtitle={`Class code: ${classItem.classCode}`} />
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px", mb: 3 }}><Typography variant="h6" fontWeight={700}>Class details</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{classItem.description || "No description provided."}</Typography></Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: "12px" }}><Typography variant="h6" fontWeight={700}>{relationName}</Typography>{sessions && sessions.length > 1 && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Showing {sessions[0].sessionName ?? sessions[0].name ?? "current session"}</Typography>}
          {relationError ? <Alert severity="error">{relationError}</Alert> : relationsLoading ? <CircularProgress size={24} /> : isSchool ? sections.length ? <List disablePadding>{sections.map((section) => <ListItem key={section.id} divider><ListItemText primary={`Section ${section.sectionCode}`} secondary={`Capacity: ${section.capacity} · ${section.status === 1 ? "Active" : "Inactive"}`} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No sections are linked to this class yet.</Typography> : batches.length ? <List disablePadding>{batches.map((batch) => <ListItem key={batch.id} divider><ListItemText primary={batch.batchName || batch.batchCode} secondary={`${batch.batchName ? `Batch code: ${batch.batchCode} · ` : ""}Capacity: ${batch.capacity}`} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No batches are linked to this class yet.</Typography>}
        </Paper>
      </>}
  </BranchWorkspace>;
}
