export default function AppLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
      <div className="h-4 w-80 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-lg border bg-muted/60" />
        <div className="h-28 animate-pulse rounded-lg border bg-muted/60" />
        <div className="h-28 animate-pulse rounded-lg border bg-muted/60" />
      </div>
      <span className="sr-only">Carregando</span>
    </div>
  );
}
