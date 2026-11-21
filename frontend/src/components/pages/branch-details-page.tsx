"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, CircularProgress, Divider, List, ListItem, ListItemText, Paper, Stack, Typography } from "@mui/material";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";

type BranchSummary = {
  branch: { branchName: string; branchCode: string; emailId: string; phoneNumber?: string | null; status: number };
  staffCount: number;
  studentCount: number;
  classes: { id: string; className: string; classCode: string }[];
};

export function BranchDetailsPage({ orgId, branchId }: { orgId: string; branchId: string }) {
  const router = useRouter();
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    fetch(`/api/backend/organisations/${orgId}/branches/${branchId}/summary`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.message ?? "Could not load branch details.");
        return body as BranchSummary;
      })
      .then((data) => { if (active) setSummary(data); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load branch details."); });
    return () => { active = false; };
  }, [orgId, branchId]);

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f6f8fb", p: { xs: 2, md: 4 } }}>
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Button startIcon={<ArrowBackOutlined />} onClick={() => router.push("/dashboard")}>Back to branches</Button>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      {!summary && !error ? <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}><CircularProgress /></Box> : summary && <>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} sx={{ mt: 2, mb: 3 }}>
          <Box><Typography variant="h4" component="h1" fontWeight={750}>{summary.branch.branchName}</Typography><Typography color="text.secondary">Branch code: {summary.branch.branchCode}</Typography></Box>
          <Typography color={summary.branch.status === 1 ? "success.dark" : "text.secondary"} fontWeight={700}>{summary.branch.status === 1 ? "Active" : "Inactive"}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          {[
            { label: "Staff", count: summary.staffCount, icon: <GroupsOutlined color="primary" /> },
            { label: "Students", count: summary.studentCount, icon: <SchoolOutlined color="primary" /> },
            { label: "Classes", count: summary.classes.length, icon: <ApartmentOutlined color="primary" /> },
          ].map((item) => <Paper key={item.label} variant="outlined" sx={{ p: 2.5, borderRadius: 3, flex: 1 }}><Stack direction="row" spacing={1.5} alignItems="center">{item.icon}<Box><Typography color="text.secondary">{item.label}</Typography><Typography variant="h4" fontWeight={700}>{item.count}</Typography></Box></Stack></Paper>)}
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Branch information</Typography><Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={4}><Box><Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography>{summary.branch.emailId}</Typography></Box><Box><Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{summary.branch.phoneNumber || "Not provided"}</Typography></Box></Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight={700}>Classes</Typography>
          {summary.classes.length ? <List>{summary.classes.map((item) => <ListItem key={item.id} divider><ListItemText primary={item.className} secondary={`Class code: ${item.classCode}`} /></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 3 }}>No classes are linked to this branch yet.</Typography>}
        </Paper>
      </>}
    </Box>
  </Box>;
}
