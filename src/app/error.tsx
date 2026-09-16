"use client";

import { Button } from "@/shared/ui/button";

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Não foi possível concluir esta ação. Tente novamente.
      </p>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
