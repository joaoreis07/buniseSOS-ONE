import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canCancelPurchases,
  canCreatePurchases,
  canReceivePurchases,
  getPurchaseForTenant,
} from "@/modules/purchases/services/purchase.service";
import {
  CancelPurchaseButton,
  ReceivePurchaseButton,
} from "@/modules/purchases/components/purchase-actions";
import {
  formatPurchaseNumber,
  PURCHASE_STATUS_LABELS,
} from "@/modules/purchases/lib/purchase-labels";
import {
  formatDateTimeBR,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
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

export default async function PurchaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("purchases:view");
  const { id } = await params;
  const purchase = await getPurchaseForTenant({
    companyId: user.companyId,
    role: user.role,
    purchaseId: id,
  });
  if (!purchase) notFound();

  const canEdit =
    canCreatePurchases(user.role) && purchase.status === "DRAFT";
  const canReceive =
    canReceivePurchases(user.role) && purchase.status === "DRAFT";
  const canCancel =
    canCancelPurchases(user.role) && purchase.status !== "CANCELLED";

  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Purchase",
      entityId: purchase.id,
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
              {formatPurchaseNumber(purchase.number)}
            </h1>
            <Badge>{PURCHASE_STATUS_LABELS[purchase.status]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {formatDateTimeBR(purchase.purchasedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/purchases">Voltar</Link>
          </Button>
          {canEdit ? (
            <Button asChild variant="outline">
              <Link href={`/app/purchases/${purchase.id}/edit`}>Editar</Link>
            </Button>
          ) : null}
          {canReceive ? (
            <ReceivePurchaseButton purchaseId={purchase.id} />
          ) : null}
          {canCancel ? (
            <CancelPurchaseButton
              purchaseId={purchase.id}
              received={purchase.status === "RECEIVED"}
            />
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/app/documents/purchase/${purchase.id}`}>Imprimir</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Link
              href={`/app/suppliers/${purchase.supplier.id}`}
              className="text-emerald-700 underline"
            >
              {purchase.supplier.name}
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Responsável</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {purchase.createdBy?.name ?? purchase.createdBy?.email ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Totais</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>Subtotal: {formatMoneyBRL(purchase.subtotal)}</p>
            <p>Desconto: {formatMoneyBRL(purchase.discountAmount)}</p>
            <p className="font-semibold">
              Total: {formatMoneyBRL(purchase.total)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itens</CardTitle>
          <CardDescription>Snapshot no momento da compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Desc.</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.productName}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.productSku}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatMoneyBRL(item.unitCost)}</TableCell>
                    <TableCell>{formatMoneyBRL(item.discountAmount)}</TableCell>
                    <TableCell>{formatMoneyBRL(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {purchase.notes ? (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{purchase.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Movimentações de estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {purchase.inventoryMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma movimentação. Rascunhos não alteram estoque.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {purchase.inventoryMovements.map((movement) => (
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
                    {formatDateTimeBR(item.createdAt)}
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
