/** Detect workflow mode from goal text at setup time. */
export function detectWorkflowMode(goal: string): "autonomous" | "collaborative" {
  const lower = goal.toLowerCase();

  const collaborativeSignals = [
    "agency",
    "outreach",
    "arr",
    "revenue",
    "clients",
    "customers",
    "sales",
    "linkedin",
    "launch",
    "marketing",
    "freelance",
    "consulting",
  ];

  const autonomousSignals = [
    "build",
    "app",
    "platform",
    "automation",
    "automate",
    "saas",
    "api",
    "software",
    "tool",
    "dashboard",
    "integration",
  ];

  const collScore = collaborativeSignals.filter((s) => lower.includes(s)).length;
  const autoScore = autonomousSignals.filter((s) => lower.includes(s)).length;

  if (collScore > autoScore) return "collaborative";
  if (autoScore > collScore) return "autonomous";
  return "autonomous";
}
