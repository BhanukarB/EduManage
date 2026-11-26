"use client";

import { useSearchParams } from "next/navigation";

export function useActiveContextQuery(): string {
  const params = useSearchParams();
  const context = new URLSearchParams();
  for (const key of ["role", "org", "branch"]) {
    const value = params.get(key);
    if (value) context.set(key, value);
  }
  const query = context.toString();
  return query ? `?${query}` : "";
}
