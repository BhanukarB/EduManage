"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { clearApiReads } from "@/lib/api";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.message ?? "We couldn't sign you in. Check your details and try again.");
        return;
      }

      clearApiReads();
      router.push("/dashboard");
    } catch {
      setError("We couldn't reach the sign-in service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(360px, 0.9fr) minmax(480px, 1.1fr)" }, bgcolor: "background.paper" }}>
      <Box sx={{ display: { xs: "none", md: "flex" }, flexDirection: "column", justifyContent: "space-between", p: { md: 6, lg: 9 }, color: "common.white", background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)` }}>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.08em", color: "common.white" }}>CLASSMANAGE</Typography>
        <Box sx={{ maxWidth: 440 }}>
          <Typography variant="h3" component="p" fontWeight={700} sx={{ lineHeight: 1.15 }}>A clearer view of your classroom.</Typography>
          <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", lineHeight: 1.7 }}>Bring your organisation, branches, and people together in one place.</Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>ClassManage · School and coaching operations</Typography>
      </Box>
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: { xs: 2, sm: 4 } }}>
      <Container maxWidth={false} sx={{ maxWidth: 440, px: 0 }}>
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider", borderRadius: "16px", boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 6px 16px rgba(15,23,42,0.04)" }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2} sx={{ display: { xs: "block", md: "none" } }}>
                CLASSMANAGE
              </Typography>
              <Typography variant="h4" component="h1" fontWeight={700} sx={{ mt: 1 }}>
                Welcome back
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Sign in to continue to your classroom.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Email address"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((visible) => !visible)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={submitting} sx={{ height: 48, fontSize: "0.9375rem" }}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Paper>
      </Container>
      </Box>
    </Box>
  );
}
