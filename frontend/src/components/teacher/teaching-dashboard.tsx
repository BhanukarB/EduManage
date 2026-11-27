"use client";

import { useEffect, useState, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Alert, Box, Chip, Container, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Typography,
} from "@mui/material";
import { PanelLoading } from "@/components/common/panel-loading";
import { useActiveContextQuery } from "@/lib/active-context";
import { api, extractErrorMessage } from "@/lib/api";

interface TeachingClass {
  id: string;
  classId: string;
  className: string;
  classCode: string;
  groupType: "section" | "batch";
  groupId: string;
  groupName: string;
  groupCode?: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  academicSessionId: string;
  sessionName: string;
  startTime?: string | null;
  endTime?: string | null;
}

function formatSchedule(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return "Not scheduled";
  return `${startTime.slice(0, 5)} – ${endTime.slice(0, 5)}`;
}

export function TeachingDashboard({ orgId, branchId, branchName }: { orgId: string; branchId: string; branchName: string | null }): ReactElement {
  const router = useRouter();
  const contextQuery = useActiveContextQuery();
  const [classes, setClasses] = useState<TeachingClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void api<TeachingClass[]>(`organisations/${orgId}/branches/${branchId}/my-classes`)
      .then((rows) => { if (active) setClasses(rows); })
      .catch((reason: unknown) => { if (active) setError(extractErrorMessage(reason, "Could not load your classes.")); });
    return () => { active = false; };
  }, [orgId, branchId]);

  function studentsHref(row: TeachingClass): string {
    const groupSegment = row.groupType === "section" ? "sections" : "batches";
    const params = new URLSearchParams(contextQuery);
    params.set("subjectId", row.subjectId);
    return `/classes/${encodeURIComponent(row.classId)}/${groupSegment}/${encodeURIComponent(row.groupId)}/students?${params}`;
  }

  return (
    <Box component="main" sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" fontWeight={700}>Classes</Typography>
        {branchName && <Typography color="text.secondary" sx={{ mb: 3 }}>{branchName}</Typography>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
          <Box sx={{ px: 3, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Assigned classes</Typography>
          </Box>
          {classes === null && !error ? (
            <PanelLoading padding={6} />
          ) : classes && classes.length > 0 ? (
            <TableContainer>
              <Table aria-label="Assigned classes">
                <TableHead>
                  <TableRow>
                    <TableCell>Class</TableCell>
                    <TableCell>Section / Batch</TableCell>
                    <TableCell>Subject</TableCell>
                    <TableCell>Schedule</TableCell>
                    <TableCell>Session</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((row) => {
                    const href = studentsHref(row);
                    const groupLabel = row.groupType === "section"
                      ? `Section ${row.groupName}`
                      : `${row.groupName}${row.groupCode ? ` (${row.groupCode})` : ""}`;
                    return (
                      <TableRow
                        key={row.id}
                        hover
                        onClick={() => router.push(href)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{row.className}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.classCode}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            component={Link}
                            href={href}
                            clickable
                            size="small"
                            variant="outlined"
                            label={groupLabel}
                            onClick={(event) => event.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>{row.subjectName}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.subjectCode}</Typography>
                        </TableCell>
                        <TableCell>{formatSchedule(row.startTime, row.endTime)}</TableCell>
                        <TableCell>{row.sessionName}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>
              No teaching duties are assigned in this branch.
            </Typography>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
