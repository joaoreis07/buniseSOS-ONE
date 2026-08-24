"use client";

import { useActionState, useState } from "react";
import type { Product, ProductStatus, ProductType } from "@prisma/client";
import {
  createProductAction,
  updateProductAction,
  type ProductActionResult,
} from "@/modules/products/actions/product.actions";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  toMoneyInputValue,
} from "@/modules/products/lib/product-labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type ProductFormProps = {
  mode: "create" | "edit";
  product?: Product;
  categories: Array<{ id: string; name: string }>;
};

export function ProductForm({ mode, product, categories }: ProductFormProps) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState<
    ProductActionResult | undefined,
    FormData
  >(action, undefined);

  const [type, setType] = useState<ProductType>(product?.type ?? "PRODUCT");
  const [status, setStatus] = useState<ProductStatus>(
    product?.status ?? "ACTIVE",
  );
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && product ? (
        <input type="hidden" name="productId" value={product.id} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Identificação
          </h2>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input
            id="sku"
            name="sku"
            required
            defaultValue={product?.sku ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de barras</Label>
          <Input
            id="barcode"
            name="barcode"
            defaultValue={product?.barcode ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <input type="hidden" name="type" value={type} />
          <Select
            value={type}
            onValueChange={(value) => setType(value as ProductType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {type === "SERVICE" ? (
            <p className="text-xs text-muted-foreground">
              Serviços não exigirão controle de estoque na FASE 6.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Produtos físicos ficarão preparados para Estoque.
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ProductStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <input type="hidden" name="categoryId" value={categoryId} />
          <Select
            value={categoryId || "none"}
            onValueChange={(value) =>
              setCategoryId(value === "none" ? "" : value)
            }
          >
            <SelectTrigger id="categoryId">
              <SelectValue placeholder="Sem categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="costPrice">Preço de custo</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toMoneyInputValue(product?.costPrice)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salePrice">Preço de venda</Label>
          <Input
            id="salePrice"
            name="salePrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={toMoneyInputValue(product?.salePrice)}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="imageUrl">Imagem principal (URL)</Label>
          <Input
            id="imageUrl"
            name="imageUrl"
            type="text"
            placeholder="https://… ou /uploads/products/…"
            defaultValue={product?.imageUrl ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Armazena apenas a referência. Upload de arquivo virá com storage
            dedicado.
          </p>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={product?.description ?? ""}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar produto"
              : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
