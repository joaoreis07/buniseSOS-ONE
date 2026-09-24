import Link from "next/link";
import type { Supplier, SupplierStatus } from "@prisma/client";
import { Badge } from "@/shared/ui/badge";
import { SUPPLIER_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";

type SupplierRow = Supplier & { _count: { purchases: number } };

export function SuppliersTable({
  items,
  canManage,
}: {
  items: SupplierRow[];
  canManage: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum fornecedor encontrado.{" "}
        {canManage ? (
          <Link href="/app/suppliers/new" className="text-[var(--bos-primary)] hover:underline">
            Cadastrar o primeiro
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fornecedor
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              CNPJ
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Nome fantasia
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Contato
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Compras
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((supplier) => (
            <tr
              key={supplier.id}
              className="transition-colors hover:bg-slate-50"
            >
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <span className="text-xs font-bold text-slate-500">
                      {supplier.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/app/suppliers/${supplier.id}`}
                      className="font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                    >
                      {supplier.name}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="hidden px-4 py-3.5 font-mono text-xs text-slate-400 md:table-cell">
                {supplier.document ?? "—"}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {supplier.tradeName ?? "—"}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-400 lg:table-cell">
                {supplier.email ?? supplier.phone ?? supplier.mobile ?? "—"}
              </td>
              <td className="px-4 py-3.5 text-right text-sm font-bold text-slate-800">
                {supplier._count.purchases}
              </td>
              <td className="px-4 py-3.5 text-center">
                <Badge
                  variant={
                    supplier.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {SUPPLIER_STATUS_LABELS[supplier.status as SupplierStatus]}
                </Badge>
              </td>
              <td className="px-4 py-3.5 text-right">
                <Link
                  href={`/app/suppliers/${supplier.id}`}
                  className="text-sm text-[var(--bos-primary)] hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
