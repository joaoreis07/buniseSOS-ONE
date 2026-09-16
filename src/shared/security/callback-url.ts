export function safeInternalPath(
  value: unknown,
  fallback = "/app",
): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (trimmed.includes("://") || trimmed.includes("\\") || /\s/.test(trimmed)) {
    return fallback;
  }
  const lowered = trimmed.toLowerCase();
  if (lowered.includes("%5c") || lowered.includes("%2f%2f")) return fallback;
  return trimmed;
}
