"use client";

import { ErrorState } from "@/shared/components/page-layout";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState title="Algo deu errado" onRetry={reset} />;
}
