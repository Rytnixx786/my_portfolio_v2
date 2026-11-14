export type ArchitectureNodeKind = "entry" | "compute" | "guard" | "storage";

/**
 * Classifies an architecture stage ID and position index into a semantic visual role.
 */
export function classifyNodeKind(id: string, idx: number): ArchitectureNodeKind {
  if (idx === 0 || /^(client|mobile_ui)$/i.test(id)) return "entry";
  if (/cache|db|sqlite|golden|ledger|rls|memory|store|storage|dense|sparse|audit|shadow/i.test(id)) {
    return "storage";
  }
  if (/guard|finops|limiter|hitl|refusal|breaker|middleware|filter|revoker|\bgate\b|_gate/i.test(id)) {
    return "guard";
  }
  return "compute";
}
