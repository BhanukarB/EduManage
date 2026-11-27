"use client";

import { useEffect, useState, type ReactElement, type ReactNode } from "react";
import { Alert, Breadcrumbs, CircularProgress, Link as MuiLink, Paper, Tab, Tabs, Typography } from "@mui/material";
import Link from "next/link";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { PageHeader } from "@/components/common/page-header";
import { SectionSubjects, type ClassSection } from "@/components/branch/section-management";
import { useActiveContextQuery } from "@/lib/active-context";
import { extractErrorMessage, readApi } from "@/lib/api";

interface SectionHeaderProps {
  classId: string;
  sectionId: string;
  name?: string;
  tab: "subjects" | "students";
  action?: ReactNode;
}

export function SectionHeader({ classId, sectionId, name, tab, action }: SectionHeaderProps): ReactElement {
  const query = useActiveContextQuery();
  const classPath = `/classes/${classId}`;
  const sectionPath = `${classPath}/sections/${sectionId}`;
  return <>
    <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 3 }}>
      <MuiLink component={Link} href={`/classes${query}`}>Classes</MuiLink>
      <MuiLink component={Link} href={`${classPath}${query}`}>Class details</MuiLink>
      <Typography color="text.primary">{name ?? "Section"}</Typography>
    </Breadcrumbs>
    <PageHeader title={name ?? "Section"} action={action} />
    <Tabs aria-label="Section details" value={tab} sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
      <Tab component={Link} href={`${sectionPath}${query}`} label="Subjects" value="subjects" />
      <Tab component={Link} href={`${sectionPath}/students${query}`} label="Students" value="students" />
    </Tabs>
  </>;
}

interface SectionDetailsProps { orgId: string; branchId: string; classId: string; sectionId: string }

export function SectionDetailsPage({ orgId, branchId, classId, sectionId }: SectionDetailsProps): ReactElement {
  const [section, setSection] = useState<ClassSection | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    readApi<ClassSection[]>(`organisations/${orgId}/${branchId}/class-sections?classId=${encodeURIComponent(classId)}`, 30_000)
      .then(rows => {
        if (!active) return;
        const match = rows.find(row => row.id === sectionId);
        if (match) setSection(match);
        else setError("Section not found in this class.");
      })
      .catch((reason: unknown) => { if (active) setError(extractErrorMessage(reason, "Could not load section.")); });
    return () => { active = false; };
  }, [orgId, branchId, classId, sectionId]);

  return <BranchWorkspace>
    <SectionHeader classId={classId} sectionId={sectionId} name={section && `Section ${section.sectionCode}` || undefined} tab="subjects" />
    {error ? <Alert severity="error">{error}</Alert> : section ? (
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <SectionSubjects orgId={orgId} branchId={branchId} section={section} />
      </Paper>
    ) : <CircularProgress size={24} aria-label="Loading section" />}
  </BranchWorkspace>;
}
