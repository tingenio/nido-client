export function assigneeEarnsPoints(assignee?: { role?: string } | null): boolean {
  return assignee?.role !== "external";
}
