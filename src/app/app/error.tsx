"use client";

import { Button } from "@/shared/ui/button";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Algo deu errado</h1>
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar esta página. Tente novamente. Se o problema
        continuar, fale com o administrador.
      </p>
      <Button type="button" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
