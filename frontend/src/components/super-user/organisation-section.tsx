import { PanelLoading } from "@/components/common/panel-loading";
import { Alert, Box, Button, Chip, List, ListItemButton, Paper, Stack, Typography } from "@mui/material";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ApartmentOutlined from "@mui/icons-material/ApartmentOutlined";
import type { Organisation } from "@/types/domain";
import { orgTypeLabel } from "@/lib/formatters";
import { EmptyState } from "@/components/common/empty-state";

interface OrganisationSectionProps {
  organisations: Organisation[];
  loading: boolean;
  error: string | null;
  notice: string | null;
  onCreate: () => void;
  onOpen: (organisation: Organisation) => void;
  onDismissNotice: () => void;
}

export function OrganisationSection({ organisations, loading, error, notice, onCreate, onOpen, onDismissNotice }: OrganisationSectionProps) {
  return <Paper elevation={0} sx={{ p: { xs: 3, md: 4 }, border: "1px solid", borderColor: "divider" }}>
    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} spacing={2}>
      <Typography variant="h6" fontWeight={600}>Organisations</Typography>
      <Button variant="contained" startIcon={<AddOutlined />} onClick={onCreate}>Create organisation</Button>
    </Stack>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    {notice && <Alert severity="success" sx={{ mt: 2 }} onClose={onDismissNotice}>{notice}</Alert>}
    {loading ? <PanelLoading padding={6} /> : organisations.length ? (
      <List disablePadding sx={{ mt: 2, display: "grid", gap: 1.5 }}>{organisations.map((organisation) => <Paper key={organisation.id} variant="outlined" sx={{ overflow: "hidden" }}>
        <ListItemButton onClick={() => onOpen(organisation)} sx={{ px: 2.5, py: 2, display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", gap: 2, alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0, maxWidth: "100%", "& .MuiChip-label": { whiteSpace: { xs: "normal", sm: "nowrap" }, overflowWrap: "anywhere" }, "& .MuiChip-root": { height: { xs: "auto", sm: 24 } } }}>
            <Typography variant="subtitle1">{organisation.name}</Typography>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
              <Chip size="small" variant="outlined" label={`Email: ${organisation.emailId}`} />
              {organisation.phoneNumber && <Chip size="small" variant="outlined" label={`Phone: ${organisation.phoneNumber}`} />}
            </Stack>
          </Box>
          <Chip label={orgTypeLabel(organisation.type)} size="small" color="primary" variant="outlined" sx={{ flexShrink: 0 }} />
        </ListItemButton>
      </Paper>)}</List>
    ) : !error && <EmptyState icon={<ApartmentOutlined />} title="No organisations yet" description="Create your first organisation to get started." actionLabel="Create organisation" onAction={onCreate} />}
  </Paper>;
}
