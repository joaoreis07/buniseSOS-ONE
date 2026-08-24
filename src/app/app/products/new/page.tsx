import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getProductFormMeta } from "@/modules/products/services/product.service";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { ProductForm } from "@/modules/products/components/product-form";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function NewProductPage() {
  const user = await requirePermission("products:manage");
  const meta = await getProductFormMeta(user.companyId);

  return (
    <div className="space-y-6">
      <ProductsSubnav role={user.role} active="products" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Novo produto
          </h1>
          <p className="text-muted-foreground">
            Cadastro multi-tenant para uso futuro em estoque e vendas
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/app/products">Voltar</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm mode="create" categories={meta.categories} />
        </CardContent>
      </Card>
    </div>
  );
}
