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
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.message ?? "We couldn't sign you in. Check your details and try again.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("We couldn't reach the sign-in service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box component="main" sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, border: "1px solid", borderColor: "divider" }}>
          <Stack spacing={3} component="form" onSubmit={handleSubmit}>
            <Box>
              <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={2}>
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
            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
