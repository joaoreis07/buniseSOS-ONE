import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import {
  getProductForTenant,
  getProductFormMeta,
} from "@/modules/products/services/product.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { ProductForm } from "@/modules/products/components/product-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("products:manage");
  const { id } = await params;
  const [product, meta] = await Promise.all([
    getProductForTenant({
      companyId: user.companyId,
      role: user.role,
      productId: id,
    }),
    getProductFormMeta(user.companyId),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <ProductsSubnav role={user.role} active="products" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Editar produto
          </h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/app/products/${product.id}`}>Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            mode="edit"
            product={product}
            categories={meta.categories}
          />
        </CardContent>
      </Card>
    </div>
  );
}
