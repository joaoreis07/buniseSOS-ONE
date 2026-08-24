import Link from "next/link";
import type { Customer, CustomerStatus } from "@prisma/client";
import {
  CUSTOMER_STATUS_LABELS,
  formatDocument,
  formatPhone,
} from "@/modules/crm/lib/customer-labels";
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
};

function statusVariant(status: CustomerStatus) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "BLOCKED") return "destructive" as const;
  return "secondary" as const;
}

export function CustomersTable({
  items,
  canManage,
}: {
  items: CustomerRow[];
  canManage: boolean;
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
            <TableHead>Nome</TableHead>
            <TableHead className="hidden md:table-cell">Documento</TableHead>
            <TableHead className="hidden lg:table-cell">Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Responsável</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="font-medium">{customer.name}</div>
                {customer.tradeName ? (
                  <div className="text-xs text-muted-foreground">
                    {customer.tradeName}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatDocument(customer.document)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <div>{customer.email ?? "—"}</div>
                <div className="text-xs text-muted-foreground">
                  {formatPhone(customer.mobile ?? customer.phone)}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant(customer.status)}>
                  {CUSTOMER_STATUS_LABELS[customer.status]}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {customer.owner?.name ?? customer.owner?.email ?? "—"}
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
