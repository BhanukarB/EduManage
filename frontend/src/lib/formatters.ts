const ORG_TYPE_LABEL: Record<number, string> = { 1: "School", 2: "Coaching" };

export function orgTypeLabel(type: number): string {
  return ORG_TYPE_LABEL[type] ?? `Type ${type}`;
}

export function statusLabel(status: number): string {
  return status === 1 ? "Active" : "Inactive";
}

export function permissionLabel(permission: string): string {
  return permission.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
