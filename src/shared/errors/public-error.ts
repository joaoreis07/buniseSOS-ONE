const INTERNAL_RE =
  /prisma|sqlstate|EPERM|ENOENT|node_modules|P20\d{2}|select |from "|at Object\.|query_engine|[\\/]users[\\/]|invalid `prisma|invocation in/i;

export function publicErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const message = error.message.replace(/\s+/g, " ").trim();
  if (!message || message.length > 180) return fallback;
  if (INTERNAL_RE.test(message)) return fallback;
  return message;
}
