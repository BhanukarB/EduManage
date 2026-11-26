"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import MenuOpenOutlined from "@mui/icons-material/MenuOpenOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { Avatar, Box, IconButton, Tooltip, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { api } from "@/lib/api";
import type { Assignment } from "@/types/domain";

const dashboard = { label: "Dashboard", href: "/dashboard", icon: <DashboardOutlined /> };
const navigation = {
  member: [dashboard],
  organisation: [
    dashboard,
    { label: "Branches", href: "/branches", icon: <ApartmentOutlined /> },
    { label: "Academic Sessions", href: "/academic-sessions", icon: <CalendarMonthOutlined /> },
    { label: "Members", href: "/members", icon: <GroupsOutlined /> },
    { label: "Subjects", href: "/subjects", icon: <SchoolOutlined /> },
  ],
  branch: [
    dashboard,
    { label: "Subjects", href: "/subjects", icon: <SchoolOutlined /> },
    { label: "Classes", href: "/classes", icon: <SchoolOutlined /> },
    { label: "Staff", href: "/staff", icon: <GroupsOutlined /> },
  ],
  super: [
    { label: "Organisations", href: "/organisations", icon: <ApartmentOutlined /> },
    { label: "Role Manager", href: "/role-manager", icon: <AdminPanelSettingsOutlined /> },
  ],
};

export function WorkspaceSidebar({ role, email, initiallyHidden }: {
  role: keyof typeof navigation;
  email?: string;
  initiallyHidden: boolean;
}): ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hidden, setHidden] = useState(initiallyHidden);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  useEffect(() => { void api<Assignment[]>("users/me/assignments").then(setAssignments); }, []);
  const roleAssignments = useMemo(() => {
    const unique = new Map<string, Assignment>();
    for (const assignment of assignments) if (!unique.has(assignment.roleId)) unique.set(assignment.roleId, assignment);
    return [...unique.values()];
  }, [assignments]);
  const requestedRole = searchParams.get("role");
  const selected = assignments.find(item => item.roleId === requestedRole && (!item.branchId || item.branchId === searchParams.get("branch")))
    ?? assignments.find(item => item.roleId === requestedRole) ?? assignments[0];
  const selectedRole = selected?.name === "super_admin" ? "super" : selected?.name === "org_admin" ? "organisation"
    : selected?.name === "branch_manager" || selected?.name === "teacher" ? "branch" : role;
  const branchOptions = selected ? assignments.filter(item => item.roleId === selected.roleId && item.branchId) : [];
  useEffect(() => {
    if (!requestedRole && selected) selectContext(selected.roleId, selected.branchId ?? undefined);
  // The selected assignment is loaded asynchronously, then normalized into the URL once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedRole, selected?.roleId]);
  const toggleLabel = hidden ? "Show sidebar" : "Hide sidebar";
  const compact = selectedRole === "organisation";
  let section = "/" + pathname.split("/")[1];
  if (selectedRole === "branch" && section === "/branches") section = "/dashboard";
  if (selectedRole === "super" && section === "/dashboard") section = "/organisations";

  function selectContext(roleId: string, branchId?: string): void {
    const eligible = assignments.filter(item => item.roleId === roleId && item.branchId);
    const validBranchId = branchId && eligible.some(item => item.branchId === branchId) ? branchId : undefined;
    const match = assignments.find(item => item.roleId === roleId && (!validBranchId || item.branchId === validBranchId))
      ?? assignments.find(item => item.roleId === roleId);
    if (!match) return;
    const params = new URLSearchParams({ role: match.roleId });
    if (match.orgId) params.set("org", match.orgId);
    const chosenBranch = validBranchId ? match.branchId : eligible.length === 1 ? eligible[0].branchId : null;
    if (chosenBranch) params.set("branch", chosenBranch);
    localStorage.setItem(`cm_context_${roleId}`, chosenBranch ?? "");
    router.push(`/dashboard?${params.toString()}`);
  }

  function toggleSidebar(): void {
    document.cookie = `cm_sidebar_hidden=${hidden ? "0" : "1"}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setHidden(!hidden);
  }

  return (
    <Box component="aside" sx={{
      position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
      width: hidden ? 48 : compact ? { xs: 72, sm: 240 } : { xs: 72, sm: 260 }, flexShrink: 0,
      bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider",
      p: hidden ? 0.5 : compact ? { xs: 1, sm: 2 } : { xs: 1, sm: 2.5 }, display: "flex", flexDirection: "column",
      pt: { xs: 2, sm: 3 }, transition: "width 0.2s ease",
    }}>
      <Tooltip title={toggleLabel} placement="right">
        <IconButton aria-label={toggleLabel} aria-expanded={!hidden} aria-controls="workspace-navigation"
          onClick={toggleSidebar} sx={{ alignSelf: "center", mb: 1 }}>
          {hidden ? <MenuOutlined /> : <MenuOpenOutlined />}
        </IconButton>
      </Tooltip>
      <Box id="workspace-navigation" sx={{ display: hidden ? "none" : "flex", flexDirection: "column", flex: 1 }}>
        <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1.5}
          sx={{ px: { xs: 0, sm: 1 }, textAlign: { xs: "center", sm: "left" }, mb: 2.5, pb: 2, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap", overflow: "hidden" }}>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>CLASSMANAGE</Box><Box component="span" sx={{ display: { xs: "inline", sm: "none" }, fontWeight: 900 }}>C</Box>
        </Typography>
        <List disablePadding>
          {roleAssignments.length > 0 && <Stack spacing={1.5} sx={{ mb: 2 }}>
            <TextField select size="small" label="Acting role" value={selected?.roleId ?? ""}
              onChange={event => selectContext(event.target.value, localStorage.getItem(`cm_context_${event.target.value}`) ?? undefined)}>
              {roleAssignments.map(item => <MenuItem key={item.roleId} value={item.roleId}>{item.name.replaceAll("_", " ")}</MenuItem>)}
            </TextField>
            {branchOptions.length > 0 && <TextField select size="small" label="Branch" value={searchParams.get("branch") ?? ""}
              onChange={event => selectContext(selected.roleId, event.target.value)}>
              {branchOptions.length > 1 && <MenuItem value="" disabled>Choose a branch</MenuItem>}
              {branchOptions.map(item => <MenuItem key={item.branchId} value={item.branchId ?? ""}>{item.branchName}</MenuItem>)}
            </TextField>}
          </Stack>}
          {navigation[selectedRole].filter(item => selected?.name !== "teacher" || ["Dashboard", "Classes"].includes(item.label)).map((item) => {
            const context = selected ? `?role=${selected.roleId}${selected.orgId ? `&org=${selected.orgId}` : ""}${selected.branchId ? `&branch=${selected.branchId}` : ""}` : "";
            return (
            <ListItemButton
              key={item.label}
              aria-label={item.label}
              aria-current={section === item.href ? "page" : undefined}
              component={Link}
              href={`${item.href}${context}`}
              selected={section === item.href}
              sx={{
                borderRadius: "10px", mb: 0.5,
                ...(compact ? { py: 1.25, px: { xs: 1, sm: 1.5 }, color: "text.secondary", "&:hover": { bgcolor: "action.hover" } } : {}),
                "&.Mui-selected": {
                  bgcolor: "primary.main", color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                  "& .MuiListItemIcon-root": { color: "inherit" },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 0, sm: 40 }, color: "inherit", justifyContent: "center" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} sx={{ display: { xs: "none", sm: "block" } }} />
            </ListItemButton>
          );})}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {email && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems="center" sx={{ px: { sm: 1 }, py: 1.5, mb: 0.5, overflow: "hidden" }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: "primary.main", color: "common.white", flexShrink: 0 }}>{email.charAt(0).toUpperCase()}</Avatar>
          <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}><Typography variant="subtitle2" noWrap>Signed in</Typography><Typography variant="caption" color="text.secondary" noWrap>{email}</Typography></Box>
        </Stack>}
      </Box>
    </Box>
  );
}
