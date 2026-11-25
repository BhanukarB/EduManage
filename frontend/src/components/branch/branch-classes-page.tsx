"use client";

import { PanelLoading } from "@/components/common/panel-loading";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemButton, ListItemText, Paper, Snackbar, Stack, TextField, Typography } from "@mui/material";
import { BranchWorkspace } from "@/components/layout/branch-workspace";
import { readBranchClasses, type BranchClass } from "./branch-data";
import { PageHeader } from "@/components/common/page-header";
import { api, extractErrorMessage } from "@/lib/api";

export function BranchClassesPage({ orgId, branchId }: { orgId: string; branchId: string }) {
  const [classes, setClasses] = useState<BranchClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BranchClass | null>(null);
  const [form, setForm] = useState({ className: "", classCode: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    readBranchClasses(orgId, branchId)
      .then((result) => { if (active) setClasses(result); })
      .catch((reason: unknown) => { if (active) setError(extractErrorMessage(reason, "Could not load classes.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [orgId, branchId]);

  const openDialog = (item?: BranchClass) => {
    setEditing(item ?? null);
    setForm({ className: item?.className ?? "", classCode: item?.classCode ?? "", description: item?.description ?? "" });
    setDialogOpen(true);
  };
  const save = async () => {
    setSaving(true); setError(null);
    try {
      const path = editing ? `organisations/${orgId}/${branchId}/classes/update/${editing.id}` : `organisations/${orgId}/${branchId}/classes/create`;
      const item = await api<BranchClass>(path, { method: editing ? "PUT" : "POST", body: JSON.stringify({ ...form, orgId, branchId, description: form.description || null }) });
      setClasses((current) => editing ? current.map((row) => row.id === item.id ? item : row) : [...current, item]);
      setDialogOpen(false); setNotice(editing ? "Class updated." : "Class created.");
    } catch (reason) { setError(extractErrorMessage(reason, "Could not save class.")); }
    finally { setSaving(false); }
  };

  return <BranchWorkspace>
      <PageHeader title="Classes" subtitle="Classes assigned to this branch" action={<Button variant="contained" disabled={loading} onClick={() => openDialog()}>Add class</Button>} />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper variant="outlined" sx={{ borderRadius: "12px", px: { xs: 1, md: 2 } }}>
        {loading ? <PanelLoading padding={8} /> : classes.length ? <List disablePadding>{classes.map((item) => <ListItem key={item.id} divider disablePadding><Stack direction="row" alignItems="center" sx={{ width: "100%", pr: 1 }}><ListItemButton component={Link} href={`/classes/${encodeURIComponent(item.id)}`}><ListItemText primary={item.className} secondary={`Class code: ${item.classCode}${item.description ? ` · ${item.description}` : ""}`} /></ListItemButton><Button size="small" onClick={() => openDialog(item)}>Edit</Button></Stack></ListItem>)}</List> : <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>No classes are linked to this branch yet.</Typography>}
      </Paper>
    <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm"><DialogTitle>{editing ? "Update class" : "Create class"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ pt: 1 }}><TextField required label="Class name" value={form.className} onChange={(event) => setForm({ ...form, className: event.target.value })} /><TextField required label="Class code" value={form.classCode} onChange={(event) => setForm({ ...form, classCode: event.target.value })} /><TextField multiline minRows={2} label="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Stack></DialogContent><DialogActions><Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button><Button variant="contained" onClick={() => void save()} disabled={saving || !form.className.trim() || !form.classCode.trim()}>{editing ? "Save changes" : "Create class"}</Button></DialogActions></Dialog>
    <Snackbar open={Boolean(notice)} autoHideDuration={3500} onClose={() => setNotice("")} message={notice} />
  </BranchWorkspace>;
}
