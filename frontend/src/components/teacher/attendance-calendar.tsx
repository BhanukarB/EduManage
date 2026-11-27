"use client";

import { useEffect, useState, type ReactElement } from "react";
import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { extractErrorMessage, readApi } from "@/lib/api";

interface CalendarProps {
  path: string;
  subjectId: string;
  subjectName?: string;
}

interface CalendarResult {
  url: string;
  presentDates?: string[];
  error?: string;
}

export function AttendanceCalendar({ path, subjectId, subjectName }: CalendarProps): ReactElement {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const year = month.getFullYear();
  const index = month.getMonth();
  const last = new Date(year, index + 1, 0);
  const startDate = month.toLocaleDateString("en-CA");
  const endDate = last.toLocaleDateString("en-CA");
  const url = path + "?" + new URLSearchParams({ subjectId, startDate, endDate });
  const [result, setResult] = useState<CalendarResult | null>(null);
  const current = result?.url === url ? result : null;
  useEffect(() => {
    let active = true;
    readApi<{ presentDates: string[] }>(url)
      .then(data => { if (active) setResult({ url, presentDates: data.presentDates }); })
      .catch(reason => { if (active) setResult({ url, error: extractErrorMessage(reason, "Could not load attendance.") }); });
    return () => { active = false; };
  }, [url]);

  return <Box component="section" aria-label="Attendance calendar" sx={{ mb: 2 }}>
    <Typography variant="h6">Attendance{subjectName && ` · ${subjectName}`}</Typography>
    <Stack direction="row" alignItems="center" justifyContent="space-between" my={1}>
      <Button onClick={() => setMonth(new Date(year, index - 1, 1))}>Previous month</Button>
      <Typography aria-live="polite">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</Typography>
      <Button disabled={last >= new Date() || endDate === new Date().toLocaleDateString("en-CA")}
        onClick={() => setMonth(new Date(year, index + 1, 1))}>Next month</Button>
    </Stack>
    {current?.error ? <Alert severity="error">{current.error}</Alert> : !current?.presentDates ?
      <CircularProgress aria-label="Loading attendance" /> : <>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: 0.5 }}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <Typography variant="caption" key={day}>{day}</Typography>)}
        {Array.from({ length: last.getDate() }, (_, i) => {
          const day = i + 1;
          const iso = endDate.slice(0, 8) + String(day).padStart(2, "0");
          const present = current.presentDates?.includes(iso);
          return <Box key={day} component="time" dateTime={iso} aria-label={iso + (present ? " present" : " unmarked")}
            sx={{ gridColumnStart: day === 1 ? month.getDay() + 1 : undefined, py: 0.75, borderRadius: 1,
              bgcolor: present ? "success.light" : "action.hover" }}>{day}{present && " ✓"}</Box>;
        })}
      </Box>
      <Typography variant="caption">✓ Present · Blank days have no attendance mark.</Typography>
    </>}
  </Box>;
}
