import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canCancelSales,
  getSaleForTenant,
} from "@/modules/sales/services/sale.service";
import { CancelSaleButton } from "@/modules/sales/components/cancel-sale-button";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
  formatDateTimeBR,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
import { formatSaleNumber } from "@/modules/sales/lib/sale-totals";
import { RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import { PRODUCT_TYPE_LABELS } from "@/modules/products/lib/product-labels";
import { INVENTORY_MOVEMENT_LABELS } from "@/modules/inventory/lib/inventory-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { prisma } from "@/shared/db/prisma";
import { canViewFinance } from "@/modules/finance/services/finance.service";
import { canSendCommunications } from "@/modules/communications/services/communication.service";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("sales:view");
  const { id } = await params;
  const sale = await getSaleForTenant({
    companyId: user.companyId,
    role: user.role,
    saleId: id,
  });
  if (!sale) notFound();

  const canCancel =
    canCancelSales(user.role) && sale.status === "COMPLETED";
  const canViewFinancialDetail = canViewFinance(user.role);
  const canSendSaleWhatsApp =
    canSendCommunications(user.role) &&
    sale.status === "COMPLETED" &&
    Boolean(sale.customer);

  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Sale",
      entityId: sale.id,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {formatSaleNumber(sale.number)}
            </h1>
            <Badge>{SALE_STATUS_LABELS[sale.status]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDateTimeBR(sale.completedAt ?? sale.createdAt)} ·{" "}
            {PAYMENT_METHOD_LABELS[sale.paymentMethod]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/sales">Voltar</Link>
          </Button>
          {canSendSaleWhatsApp && sale.customer ? (
            <Button asChild>
              <Link
                href={`/app/communications/new?customerId=${sale.customer.id}&saleId=${sale.id}&intent=sale`}
              >
                Enviar resumo pelo WhatsApp
              </Link>
            </Button>
          ) : null}
          {canCancel ? <CancelSaleButton saleId={sale.id} /> : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {sale.customer ? (
              <Link
                href={`/app/crm/${sale.customer.id}`}
                className="text-emerald-700 underline"
              >
                {sale.customer.name}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Sem cliente</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {sale.seller?.name ?? sale.seller?.email ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Subtotal: {formatMoneyBRL(sale.subtotal)}</p>
            <p>Desconto: {formatMoneyBRL(sale.discountAmount)}</p>
            <p className="font-semibold">Total: {formatMoneyBRL(sale.total)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
          <CardDescription>Preços no momento da venda</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Unit.</TableHead>
                <TableHead>Desc.</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sale.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.productName}</div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.productSku}
                    </div>
                  </TableCell>
                  <TableCell>
                    {PRODUCT_TYPE_LABELS[item.productType]}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatMoneyBRL(item.unitPrice)}</TableCell>
                  <TableCell>{formatMoneyBRL(item.discountAmount)}</TableCell>
                  <TableCell>{formatMoneyBRL(item.lineTotal)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sale.accountReceivable ? (
        <Card>
          <CardHeader>
            <CardTitle>Financeiro</CardTitle>
            <CardDescription>Conta a receber gerada na conclusão da venda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Status: <span className="font-medium">{RECEIVABLE_STATUS_LABELS[sale.accountReceivable.status]}</span></p>
            <p>Pago: {formatMoneyBRL(sale.accountReceivable.paidAmount)} · Saldo: {formatMoneyBRL(sale.accountReceivable.remainingAmount)}</p>
            {canViewFinancialDetail ? <Button asChild size="sm" variant="outline"><Link href={`/app/finance/${sale.accountReceivable.id}`}>Ver parcelas e pagamentos</Link></Button> : null}
          </CardContent>
        </Card>
      ) : null}

      {sale.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{sale.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Movimentações de estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {sale.inventoryMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma movimentação (somente serviços ou venda sem produtos
              físicos).
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {sale.inventoryMovements.map((movement) => (
                <li
                  key={movement.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span>
                    {INVENTORY_MOVEMENT_LABELS[movement.type]} ·{" "}
                    {movement.product.name} · qtd {movement.quantity}
                  </span>
                  <Link
                    href={`/app/inventory/${movement.productId}`}
                    className="text-xs text-emerald-700 underline"
                  >
                    Estoque
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem eventos registrados ainda.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span>
                    <span className="font-medium">{item.action}</span>
                    {" · "}
                    {item.user?.name ?? item.user?.email ?? "Sistema"}
                  </span>
                  <span className="text-muted-foreground">
                    {item.createdAt.toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
