import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  canManageProducts,
  getProductForTenant,
} from "@/modules/products/services/product.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { DeleteProductButton } from "@/modules/products/components/delete-product-button";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  formatMoneyBRL,
} from "@/modules/products/lib/product-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { prisma } from "@/shared/db/prisma";

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  );
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("products:view");
  const { id } = await params;
  const product = await getProductForTenant({
    companyId: user.companyId,
    role: user.role,
    productId: id,
  });
  if (!product) notFound();
  const canManage = canManageProducts(user.role);

  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Product",
      entityId: product.id,
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
      <ProductsSubnav role={user.role} active="products" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <Badge>{PRODUCT_STATUS_LABELS[product.status]}</Badge>
            <Badge variant="secondary">
              {PRODUCT_TYPE_LABELS[product.type]}
            </Badge>
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            SKU {product.sku}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/products">Voltar</Link>
          </Button>
          {canManage ? (
            <>
              <Button asChild>
                <Link href={`/app/products/${product.id}/edit`}>Editar</Link>
              </Button>
              <DeleteProductButton productId={product.id} />
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="SKU" value={product.sku} />
              <DetailItem label="Código de barras" value={product.barcode} />
              <DetailItem
                label="Categoria"
                value={product.category?.name ?? "—"}
              />
              <DetailItem
                label="Preço de custo"
                value={formatMoneyBRL(product.costPrice)}
              />
              <DetailItem
                label="Preço de venda"
                value={formatMoneyBRL(product.salePrice)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Imagem</CardTitle>
          </CardHeader>
          <CardContent>
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-h-48 rounded-md border object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">Sem imagem</p>
            )}
            {product.imageUrl ? (
              <p className="mt-2 break-all text-xs text-muted-foreground">
                {product.imageUrl}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Descrição</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">
              {product.description || "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
          <CardDescription>Auditoria do produto</CardDescription>
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
