import Link from "next/link";
import type { Customer, CustomerStatus } from "@prisma/client";
import {
  CUSTOMER_STATUS_LABELS,
  formatDocument,
  formatPhone,
} from "@/modules/crm/lib/customer-labels";
import type { CustomerListMetrics } from "@/modules/crm/repositories/customer.repository";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type CustomerRow = Customer & {
  owner: { id: string; name: string | null; email: string } | null;
  metrics: CustomerListMetrics;
};

function statusVariant(status: CustomerStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "BLOCKED") return "destructive" as const;
  return "secondary" as const;
}

export function CustomersTable({
  items,
  canManage,
  canSales,
  canFinance,
}: {
  items: CustomerRow[];
  canManage: boolean;
  canSales: boolean;
  canFinance: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum cliente encontrado.
        {canManage ? (
          <>
            {" "}
            <Link href="/app/crm/new" className="text-emerald-700 underline">
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Contato</TableHead>
            {canSales ? (
              <>
                <TableHead className="hidden lg:table-cell">Vendas</TableHead>
                <TableHead className="hidden lg:table-cell">Total</TableHead>
                <TableHead className="hidden xl:table-cell">Última compra</TableHead>
              </>
            ) : null}
            {canFinance ? (
              <TableHead className="hidden md:table-cell">Em aberto</TableHead>
            ) : null}
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="font-medium">{customer.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDocument(customer.document)}
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <div>{customer.email ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPhone(customer.mobile ?? customer.phone)}
                </div>
              </TableCell>
              {canSales ? (
                <>
                  <TableCell className="hidden lg:table-cell">
                    {customer.metrics.salesCount}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {formatMoneyBRL(customer.metrics.salesTotal)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {formatDateBR(customer.metrics.lastSaleAt)}
                  </TableCell>
                </>
              ) : null}
              {canFinance ? (
                <TableCell className="hidden md:table-cell">
                  {formatMoneyBRL(customer.metrics.openBalance)}
                </TableCell>
              ) : null}
              <TableCell>
                <Badge variant={statusVariant(customer.status)}>
                  {CUSTOMER_STATUS_LABELS[customer.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/app/crm/${customer.id}`}>Ver</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
