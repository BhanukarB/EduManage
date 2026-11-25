"use client";

import { useEffect, useState, type FormEvent, type ReactElement } from "react";
import { Alert, Box, Button, MenuItem, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { PageHeader } from "@/components/common/page-header";
import { PanelLoading } from "@/components/common/panel-loading";
import { api, extractErrorMessage } from "@/lib/api";

interface Subject {
  id: string;
  subjectName: string;
  subjectCode: string;
  description?: string | null;
}

interface BranchSubjects {
  catalogue: Subject[];
  assigned: Subject[];
}

export function BranchSubjectsPage({ orgId, branchId }: { orgId: string; branchId: string }): ReactElement {
  const path = `organisations/${orgId}/subjects`;
  const [data, setData] = useState<BranchSubjects | null>(null);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([api<Subject[]>(path), api<Subject[]>(`${path}?branchId=${branchId}`)])
      .then(([catalogue, assigned]) => { if (active) setData({ catalogue, assigned }); })
      .catch((reason: unknown) => { if (active) setError(extractErrorMessage(reason, "Could not load subjects.")); });
    return () => { active = false; };
  }, [path, branchId]);

  const assignedIds = new Set(data?.assigned.map((subject) => subject.id));
  const available = data?.catalogue.filter((subject) => !assignedIds.has(subject.id)) ?? [];

  async function assignSubject(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!data || saving) return;
    const subject = available.find((item) => item.id === selected);
    setNotice("");
    if (!subject) {
      setError("Select an organisation subject first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api<void>(`organisations/${orgId}/branches/${branchId}/subjects`, {
        method: "POST", body: JSON.stringify({ subjectId: subject.id }),
      });
      setData({ ...data, assigned: [...data.assigned, subject].sort((a, b) => a.subjectName.localeCompare(b.subjectName)) });
      setSelected("");
      setNotice(`${subject.subjectName} added to your branch.`);
    } catch (reason) {
      setError(extractErrorMessage(reason, "Could not add this subject."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="main" sx={{ maxWidth: 960, mx: "auto", p: { xs: 2, md: 5 } }}>
      <PageHeader title="Branch subjects" />
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}
        {!data && !error && <PanelLoading />}
        {data && <>
          <Paper variant="outlined" sx={{ p: 3 }}>
            {available.length ? (
              <Stack component="form" onSubmit={assignSubject} direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField select fullWidth label="Organisation subject" value={selected} disabled={saving}
                  onChange={(event) => { setSelected(event.target.value); setError(""); setNotice(""); }}>
                  {available.map((subject) => <MenuItem key={subject.id} value={subject.id}>
                    {subject.subjectName} ({subject.subjectCode})
                  </MenuItem>)}
                </TextField>
                <Button variant="contained" type="submit" disabled={saving} sx={{ flexShrink: 0 }}>
                  {saving ? "Adding…" : "Add to branch"}
                </Button>
              </Stack>
            ) : <Typography>{data.catalogue.length ? "All organisation subjects have been added." : "Your organisation has no subjects yet."}</Typography>}
          </Paper>
          <Paper component="section" variant="outlined" sx={{ overflow: "hidden" }}>
            <Typography id="branch-subjects-heading" component="h2" variant="h6" sx={{ px: 2, py: 1.5 }}>Subjects</Typography>
            {data.assigned.length ? (
              <TableContainer>
                <Table aria-labelledby="branch-subjects-heading" sx={{
                  tableLayout: "fixed",
                  "& .MuiTableCell-root": { overflowWrap: "anywhere", verticalAlign: "top", px: { xs: 1.25, sm: 2 } },
                  "& thead th": { bgcolor: "action.hover", fontWeight: 700 },
                  "& tbody tr + tr > *": { borderTop: 1, borderColor: "divider" },
                  "& tbody tr:last-child > *": { borderBottom: 0 },
                }}>
                  <TableHead>
                    <TableRow>
                      <TableCell scope="col" sx={{ width: { xs: "44%", sm: "32%" } }}>Subject name</TableCell>
                      <TableCell scope="col" sx={{ width: "18%", display: { xs: "none", sm: "table-cell" } }}>Code</TableCell>
                      <TableCell scope="col">Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.assigned.map((subject) => (
                      <TableRow key={subject.id}>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                          {subject.subjectName}
                          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>
                            Code: {subject.subjectCode}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>{subject.subjectCode}</TableCell>
                        <TableCell sx={{ whiteSpace: "pre-line" }}>{subject.description?.trim() || "No description"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography color="text.secondary" sx={{ px: 2, pb: 2 }}>No subjects assigned to this branch yet.</Typography>}
          </Paper>
        </>}
      </Stack>
    </Box>
  );
}
