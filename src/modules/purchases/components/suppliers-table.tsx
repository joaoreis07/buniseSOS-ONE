import Link from "next/link";
import type { Supplier, SupplierStatus } from "@prisma/client";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
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
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum fornecedor encontrado.{" "}
        {canManage ? (
          <Link href="/app/suppliers/new" className="text-emerald-700 underline">
            Cadastrar o primeiro
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="hidden sm:table-cell">Documento</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            <TableHead className="hidden lg:table-cell">Compras</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell>
                <div className="font-medium">{supplier.name}</div>
                {supplier.tradeName ? (
                  <div className="text-xs text-muted-foreground">
                    {supplier.tradeName}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm">
                {supplier.document ?? "—"}
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm">
                {supplier.email ?? supplier.phone ?? supplier.mobile ?? "—"}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {supplier._count.purchases}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    supplier.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {SUPPLIER_STATUS_LABELS[supplier.status as SupplierStatus]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/app/suppliers/${supplier.id}`}
                  className="text-sm text-emerald-700 underline"
                >
                  Ver
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
