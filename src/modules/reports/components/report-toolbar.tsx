import Link from "next/link";
import { queryToSearchParams } from "@/modules/reports/lib/params";
import { PaginationBar } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";

export function ReportPagination({
  href,
  query,
  page,
  pageCount,
  total,
}: {
  href: string;
  query: Record<string, unknown>;
  page: number;
  pageCount: number;
  total?: number;
}) {
  const previous = queryToSearchParams({ ...query, page: page - 1 });
  const next = queryToSearchParams({ ...query, page: page + 1 });

  if (total != null) {
    return (
      <PaginationBar
        page={page}
        pageCount={pageCount}
        total={total}
        totalLabel="registro(s)"
        prevHref={page > 1 ? `${href}?${previous.toString()}` : undefined}
        nextHref={page < pageCount ? `${href}?${next.toString()}` : undefined}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-500">
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
    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
      <a href={`/app/reports/export?${params.toString()}`}>Exportar CSV</a>
    </Button>
  );
}
