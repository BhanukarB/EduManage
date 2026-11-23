import { Chip } from "@mui/material";
import { statusLabel } from "@/lib/formatters";

export function StatusChip({ status }: { status: number }) {
  const active = status === 1;
  return <Chip size="small" label={statusLabel(status)} color={active ? "success" : "default"} />;
}
