import Link from "next/link";
import { queryToSearchParams } from "@/modules/reports/lib/params";
import { Button } from "@/shared/ui/button";

export function ReportPagination({
  href,
  query,
  page,
  pageCount,
}: {
  href: string;
  query: Record<string, unknown>;
  page: number;
  pageCount: number;
}) {
  const previous = queryToSearchParams({ ...query, page: page - 1 });
  const next = queryToSearchParams({ ...query, page: page + 1 });

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Página {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${href}?${previous.toString()}`}>Anterior</Link>
          </Button>
        ) : null}
        {page < pageCount ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`${href}?${next.toString()}`}>Próxima</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ExportCsvButton({
  type,
  query,
}: {
  type: "sales" | "finance" | "inventory" | "purchases";
  query: Record<string, unknown>;
}) {
  const params = queryToSearchParams({ ...query, type, page: undefined });
  return (
    <Button asChild variant="outline">
      <a href={`/app/reports/export?${params.toString()}`}>Exportar CSV</a>
    </Button>
  );
}
