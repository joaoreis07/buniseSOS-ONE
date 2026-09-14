import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageSuppliers,
  getSupplierForTenant,
} from "@/modules/purchases/services/supplier.service";
import {
  formatPurchaseNumber,
  SUPPLIER_STATUS_LABELS,
} from "@/modules/purchases/lib/purchase-labels";
import { formatDateTimeBR, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("suppliers:view");
  const { id } = await params;
  const supplier = await getSupplierForTenant({
    companyId: user.companyId,
    role: user.role,
    supplierId: id,
  });
  if (!supplier) notFound();
  const canManage = canManageSuppliers(user.role);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {supplier.name}
            </h1>
            <Badge>{SUPPLIER_STATUS_LABELS[supplier.status]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {supplier.tradeName ?? "Sem nome fantasia"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/suppliers">Voltar</Link>
          </Button>
          {canManage ? (
            <Button asChild>
              <Link href={`/app/suppliers/${supplier.id}/edit`}>Editar</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total comprado</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatMoneyBRL(supplier.metrics.totalPurchased)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Compras recebidas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {supplier.metrics.receivedCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Última compra</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {supplier.metrics.lastPurchase
              ? `${formatPurchaseNumber(supplier.metrics.lastPurchase.number)} · ${formatDateTimeBR(supplier.metrics.lastPurchase.receivedAt)}`
              : "—"}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastro</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <p>Documento: {supplier.document ?? "—"}</p>
          <p>E-mail: {supplier.email ?? "—"}</p>
          <p>Telefone: {supplier.phone ?? "—"}</p>
          <p>Celular: {supplier.mobile ?? "—"}</p>
          <p className="md:col-span-2">
            Endereço:{" "}
            {[
              supplier.street,
              supplier.number,
              supplier.district,
              supplier.city,
              supplier.state,
            ]
              .filter(Boolean)
              .join(", ") || "—"}
          </p>
          {supplier.notes ? (
            <p className="md:col-span-2 whitespace-pre-wrap">{supplier.notes}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compras recentes</CardTitle>
          <CardDescription>Histórico deste fornecedor</CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.purchases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma compra registrada.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {supplier.purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <Link
                    href={`/app/purchases/${purchase.id}`}
                    className="text-emerald-700 underline"
                  >
                    {formatPurchaseNumber(purchase.number)}
                  </Link>
                  <span>{formatMoneyBRL(purchase.total)}</span>
                  <span className="text-muted-foreground">
                    {formatDateTimeBR(purchase.createdAt)}
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
