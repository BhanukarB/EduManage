"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Container, List, ListItem, ListItemText, Paper, Typography } from "@mui/material";
import { api, extractErrorMessage } from "@/lib/api";

interface TeachingClass { id: string; className: string; classCode: string }

export function TeachingDashboard({ orgId, branchId, branchName }: { orgId: string; branchId: string; branchName: string | null }) {
  const [classes, setClasses] = useState<TeachingClass[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void api<TeachingClass[]>(`organisations/${orgId}/branches/${branchId}/my-classes`)
      .then(rows => { if (active) setClasses(rows); })
      .catch(reason => { if (active) setError(extractErrorMessage(reason, "Could not load your classes.")); });
    return () => { active = false; };
  }, [orgId, branchId]);
  return <Box component="main" sx={{ py: 4 }}><Container maxWidth="lg">
    <Typography variant="h4" component="h1" fontWeight={700}>Teaching dashboard</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>{branchName}</Typography>
    {error && <Alert severity="error">{error}</Alert>}
    <Paper variant="outlined" sx={{ p: 3 }}><Typography variant="h6">My classes</Typography>
      {classes?.length ? <List>{classes.map(item => <ListItem key={item.id}><ListItemText primary={item.className} secondary={item.classCode} /></ListItem>)}</List>
        : <Typography color="text.secondary" sx={{ mt: 2 }}>{classes ? "No teaching duties are assigned in this branch." : "Loading classes…"}</Typography>}
    </Paper>
  </Container></Box>;
}
