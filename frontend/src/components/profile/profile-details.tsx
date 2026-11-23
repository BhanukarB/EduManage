"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Avatar, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";
import EditOutlined from "@mui/icons-material/EditOutlined";
import { ProfileLink } from "@/components/profile-link";
import { api, extractErrorMessage } from "@/lib/api";

type UserProfile = {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  emailId: string;
  phoneNumber?: string | null;
  orgId?: string | null;
  address?: Record<string, unknown> | null;
};

export function ProfileDetails() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    api<UserProfile>("users/me")
      .then((user) => {
        if (active) setProfile(user);
      })
      .catch((reason: unknown) => {
        if (active) setError(extractErrorMessage(reason, "Could not load your profile."));
      });

    return () => {
      active = false;
    };
  }, []);

  const fullName = profile
    ? [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(" ")
    : "";

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: 8 }}>
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
              Back to dashboard
            </Button>
            <ProfileLink email={profile?.emailId} />
          </Stack>
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={3} alignItems="center">
              <Avatar sx={{ width: 80, height: 80, fontSize: 32, bgcolor: "primary.main", color: "common.white" }}>
                {fullName.charAt(0).toUpperCase() || "?"}
              </Avatar>
              <Typography variant="h4" component="h1" fontWeight={700}>Your profile</Typography>
              {error ? (
                <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
              ) : profile ? (
                <Box sx={{ width: "100%" }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" }, gap: 2, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">NAME</Typography><Typography>{fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">EMAIL</Typography><Typography sx={{ overflowWrap: "anywhere" }}>{profile.emailId}</Typography>
                    <Typography variant="caption" color="text.secondary">PHONE</Typography><Typography>{profile.phoneNumber || "Not provided"}</Typography>
                  </Box>
                </Box>
              ) : (
                <Typography color="text.secondary" role="status">Loading your profile…</Typography>
              )}
              <Button variant="outlined" disabled startIcon={<EditOutlined />} sx={{ mt: 1 }}>Edit profile</Button>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
