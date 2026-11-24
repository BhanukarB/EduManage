import type { ReactNode } from "react";
import { Avatar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";
import { SignOutButton } from "@/components/sign-out-button";

export interface DashboardNavItem {
  label: string;
  icon: ReactNode;
}

interface DashboardSidebarProps {
  items: DashboardNavItem[];
  active: string;
  onNavigate: (label: string) => void;
  email?: string;
  compact?: boolean;
}

export function DashboardSidebar({ items, active, onNavigate, email, compact = false }: DashboardSidebarProps) {
  return (
    <Box component="aside" sx={{
      width: compact ? { xs: 72, sm: 240 } : { xs: 72, sm: 260 }, flexShrink: 0,
      bgcolor: "background.paper", borderRight: "1px solid", borderColor: "divider",
      p: compact ? { xs: 1, sm: 2 } : { xs: 1, sm: 2.5 }, display: "flex", flexDirection: "column",
      pt: { xs: 2, sm: 3 }, transition: "width 0.2s ease",
    }}>
      <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing={1.5}
        sx={{ px: { xs: 0, sm: 1 }, textAlign: { xs: "center", sm: "left" }, mb: 2.5, pb: 2, borderBottom: "1px solid", borderColor: "divider", whiteSpace: "nowrap", overflow: "hidden" }}>
        <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>CLASSMANAGE</Box><Box component="span" sx={{ display: { xs: "inline", sm: "none" }, fontWeight: 900 }}>C</Box>
      </Typography>
      <List disablePadding>
        {items.map((item) => (
          <ListItemButton
            key={item.label}
            aria-label={item.label}
            aria-current={active === item.label ? "page" : undefined}
            onClick={() => onNavigate(item.label)}
            selected={active === item.label}
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
        ))}
      </List>
      <Box sx={{ flexGrow: 1 }} />
      {email && <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems="center" sx={{ px: { sm: 1 }, py: 1.5, mb: 0.5, overflow: "hidden" }}>
        <Avatar sx={{ width: 36, height: 36, fontSize: 15, bgcolor: "primary.main", color: "common.white", flexShrink: 0 }}>{email.charAt(0).toUpperCase()}</Avatar>
        <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}><Typography variant="subtitle2" noWrap>Signed in</Typography><Typography variant="caption" color="text.secondary" noWrap>{email}</Typography></Box>
      </Stack>}
      <Divider sx={{ my: 1.5 }} />
      <Box sx={{ display: { xs: "none", sm: "block" } }}><SignOutButton fullWidth /></Box>
      <Box sx={{ display: { xs: "block", sm: "none" }, textAlign: "center" }}><SignOutButton compact /></Box>
    </Box>
  );
}
