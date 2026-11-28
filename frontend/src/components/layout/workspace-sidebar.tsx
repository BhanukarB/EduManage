"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import MenuOutlined from "@mui/icons-material/MenuOutlined";
import MenuOpenOutlined from "@mui/icons-material/MenuOpenOutlined";
import DashboardOutlined from "@mui/icons-material/DashboardOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import AdminPanelSettingsOutlined from "@mui/icons-material/AdminPanelSettingsOutlined";
import { Avatar, Box, Drawer, useMediaQuery, useTheme, IconButton, Tooltip, List, ListItemButton, ListItemIcon, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ProfileLink } from "@/components/profile-link";
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

export function WorkspaceShell({ role, email, initiallyHidden, children }: {
  role: keyof typeof navigation;
  email?: string;
  initiallyHidden: boolean;
  children: ReactNode;
}): ReactElement {
  const mobile = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [menuOpen, setMenuOpen] = useState(false);
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
    if (!requestedRole && selected) selectContext(selected.roleId, selected.branchId ?? undefined, true);
  // The selected assignment is loaded asynchronously, then normalized into the URL once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedRole, selected?.roleId]);
  const toggleLabel = hidden ? "Show sidebar" : "Hide sidebar";
  const compact = selectedRole === "organisation";
  let section = "/" + pathname.split("/")[1];
  if (selectedRole === "branch" && section === "/branches") section = "/dashboard";
  if (selectedRole === "super" && section === "/dashboard") section = "/organisations";

  function selectContext(roleId: string, branchId?: string, preservePath = false): void {
    const eligible = assignments.filter(item => item.roleId === roleId && item.branchId);
    const validBranchId = branchId && eligible.some(item => item.branchId === branchId) ? branchId : undefined;
    const match = assignments.find(item => item.roleId === roleId && (!validBranchId || item.branchId === validBranchId))
      ?? assignments.find(item => item.roleId === roleId);
    if (!match) return;
    const params = new URLSearchParams(preservePath ? searchParams.toString() : "");
    params.set("role", match.roleId);
    if (match.orgId) params.set("org", match.orgId);
    else params.delete("org");
    const chosenBranch = validBranchId ? match.branchId : eligible.length === 1 ? eligible[0].branchId : null;
    if (chosenBranch) params.set("branch", chosenBranch);
    else params.delete("branch");
    localStorage.setItem(`cm_context_${roleId}`, chosenBranch ?? "");
    const targetPath = match.name === "teacher" ? "/classes" : "/dashboard";
    setMenuOpen(false);
    if (preservePath) router.replace(`${pathname}?${params.toString()}`);
    else router.push(`${targetPath}?${params.toString()}`);
  }

  function toggleSidebar(): void {
    document.cookie = `cm_sidebar_hidden=${hidden ? "0" : "1"}; Path=/; Max-Age=31536000; SameSite=Lax`;
    setHidden(!hidden);
  }

  const expanded = mobile || !hidden;
  const sidebar = (
    <Box component="nav" aria-label="Workspace" sx={{
      position: "sticky", top: 0, height: "100dvh", overflowY: "auto",
      width: expanded ? (compact ? 240 : 260) : 48, maxWidth: "85vw", flexShrink: 0,
      bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider",
      p: expanded ? (compact ? 2 : 2.5) : 0.5, display: mobile ? "flex" : { xs: "none", sm: "flex" }, flexDirection: "column",
      pt: 3, transition: "width 0.2s ease",
    }}>
      <Tooltip title={mobile ? "Close navigation" : toggleLabel} placement="right">
        <IconButton aria-label={mobile ? "Close navigation" : toggleLabel} aria-expanded={expanded} aria-controls="workspace-navigation"
          onClick={mobile ? () => setMenuOpen(false) : toggleSidebar} sx={{ alignSelf: "center", mb: 1 }}>
          {expanded ? <MenuOpenOutlined /> : <MenuOutlined />}
        </IconButton>
      </Tooltip>
      <Box id="workspace-navigation" sx={{ display: expanded ? "flex" : "none", flexDirection: "column", flex: 1 }}>
        <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1.5}
          sx={{ px: 1, mb: 2.5, pb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          CLASSMANAGE
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
          {navigation[selectedRole].filter(item => selected?.name !== "teacher" || item.label === "Classes").map((item) => {
            const context = selected ? `?role=${selected.roleId}${selected.orgId ? `&org=${selected.orgId}` : ""}${selected.branchId ? `&branch=${selected.branchId}` : ""}` : "";
            return (
            <ListItemButton
              key={item.label}
              onClick={() => setMenuOpen(false)}
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
              <ListItemIcon sx={{ minWidth: 40, color: "inherit", justifyContent: "center" }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );})}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {email && <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: { sm: 1 }, py: 1.5, mb: 0.5, overflow: "hidden" }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: "primary.main", color: "common.white", flexShrink: 0 }}>{email.charAt(0).toUpperCase()}</Avatar>
          <Box sx={{ minWidth: 0 }}><Typography variant="subtitle2" noWrap>Signed in</Typography><Typography variant="caption" color="text.secondary" noWrap>{email}</Typography></Box>
        </Stack>}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "background.default" }}>
      {mobile ? <Drawer open={menuOpen} onClose={() => setMenuOpen(false)}>{sidebar}</Drawer> : sidebar}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box component="header" sx={{
          position: "sticky", top: { xs: 8, sm: 12 }, zIndex: theme => theme.zIndex.appBar,
          display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1,
          mt: { xs: 1, sm: 1.5 }, mx: { xs: 1.5, sm: 3, md: 4 },
          px: { xs: 1, sm: 2 }, py: 0.75,
          bgcolor: "background.paper", border: 1, borderColor: "divider", borderRadius: 2,
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.10)",
        }}>
          <IconButton aria-label="Open navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}
            sx={{ display: { xs: "inline-flex", sm: "none" } }}><MenuOutlined /></IconButton>
          <Typography variant="overline" color="primary.main" sx={{ flex: 1 }}>
            ClassManage
          </Typography>
          <ProfileLink email={email} />
        </Box>
        {children}
      </Box>
    </Box>
  );
}
