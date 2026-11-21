"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Avatar, Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import ArrowBack from "@mui/icons-material/ArrowBack";

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

    fetch("/api/backend/users/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message ?? "Could not load your profile.");
        }
        return response.json() as Promise<UserProfile>;
      })
      .then((user) => {
        if (active) setProfile(user);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Could not load your profile.");
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
          <Button component={Link} href="/dashboard" startIcon={<ArrowBack />} sx={{ alignSelf: "flex-start" }}>
            Back to dashboard
          </Button>
          <Paper elevation={0} sx={{ p: { xs: 4, md: 6 }, border: "1px solid", borderColor: "divider" }}>
            <Stack spacing={3} alignItems="center">
              <Avatar sx={{ width: 72, height: 72, fontSize: 28 }}>
                {fullName.charAt(0).toUpperCase() || "?"}
              </Avatar>
              <Typography variant="h4" component="h1" fontWeight={700}>Your profile</Typography>
              {error ? (
                <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
              ) : profile ? (
                <Box sx={{ width: "100%" }}>
                  <Typography variant="overline" color="text.secondary">Name</Typography>
                  <Typography>{fullName}</Typography>
                  <Typography variant="overline" color="text.secondary" sx={{ display: "block", mt: 2 }}>Email</Typography>
                  <Typography>{profile.emailId}</Typography>
                  <Typography variant="overline" color="text.secondary" sx={{ display: "block", mt: 2 }}>Phone</Typography>
                  <Typography>{profile.phoneNumber || "Not provided"}</Typography>
                </Box>
              ) : (
                <Typography color="text.secondary" role="status">Loading your profile…</Typography>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
}
