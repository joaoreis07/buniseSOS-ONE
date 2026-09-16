"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-white text-zinc-900">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Algo deu errado
          </h1>
          <p className="text-sm text-zinc-600">
            O BusinessOS One encontrou um erro inesperado. Tente novamente.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
