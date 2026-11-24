"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Box } from "@mui/material";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import GroupsOutlined from "@mui/icons-material/GroupsOutlined";
import SchoolOutlined from "@mui/icons-material/SchoolOutlined";
import { DashboardSidebar } from "./dashboard-sidebar";

const items = [
  { label: "Dashboard", icon: <ApartmentOutlined />, href: "/dashboard" },
  { label: "Classes", icon: <SchoolOutlined />, href: "/dashboard/branch/classes" },
  { label: "Staff", icon: <GroupsOutlined />, href: "/dashboard/branch/staff" },
];

export function BranchWorkspace({ active, email, maxWidth = 1100, showSidebar = true, onDashboard, children }: {
  active: "Dashboard" | "Classes" | "Staff";
  email?: string;
  maxWidth?: number;
  showSidebar?: boolean;
  onDashboard?: () => void;
  children: ReactNode;
}): ReactNode {
  const router = useRouter();
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      {showSidebar && <DashboardSidebar items={items} active={active} email={email} onNavigate={(label) => {
        const item = items.find((option) => option.label === label);
        if (!item) return;
        if (label === "Dashboard") onDashboard?.();
        router.push(item.href);
      }} />}
      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Box sx={{ maxWidth, mx: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
}
