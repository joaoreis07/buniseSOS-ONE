"use client";

import { useState } from "react";
import { Layers, Package, Plus, Search } from "lucide-react";
import {
  DEMO_CATEGORIES,
  DEMO_PRODUCT_CATALOG,
} from "@/modules/marketing/demo-data";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import {
  PRODUCT_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
  formatMoneyBRL,
} from "@/modules/products/lib/product-labels";
import { ModulePageHeader, PageContainer, PaginationBar } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/utilities/cn";

const TYPE_PILL_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "PRODUCT", label: "Produtos", icon: Package },
  { value: "SERVICE", label: "Serviços", icon: Layers },
] as const;

function statusVariant(status: "ACTIVE" | "INACTIVE") {
  return status === "ACTIVE" ? ("default" as const) : ("secondary" as const);
}

function typeBadgeVariant(type: "PRODUCT" | "SERVICE") {
  return type === "SERVICE" ? ("secondary" as const) : ("outline" as const);
}

export function DemoProductsPageContent() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const filtered = DEMO_PRODUCT_CATALOG.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase());
    const matchType = !type || product.type === type;
    const matchCategory =
      !categoryId ||
      DEMO_CATEGORIES.find((c) => c.id === categoryId)?.name === product.category;
    return matchSearch && matchType && matchCategory;
  });

  return (
    <PageContainer>
      <ProductsSubnav variant="demo" active="products" />

      <ModulePageHeader
        title="Produtos e Serviços"
        subtitle={`${DEMO_PRODUCT_CATALOG.length} / 30 produtos (plano Free)`}
        actions={
          <Button type="button" disabled size="sm">
            <Plus className="size-3.5" aria-hidden />
            Novo produto
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou SKU…"
                className="h-9 w-full pl-9 sm:w-64"
              />
            </div>
            <div className="flex shrink-0 gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
              {TYPE_PILL_OPTIONS.map((option) => {
                const Icon = "icon" in option ? option.icon : null;
                const isActive = type === option.value;
                return (
                  <button
                    key={option.value || "all"}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-slate-800 text-white"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                  >
                    {Icon ? <Icon className="size-3" aria-hidden /> : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <details className="group rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-600 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">Mostrar filtros avançados</span>
            <span className="hidden group-open:inline">Ocultar filtros avançados</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-3">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="demo-category">Categoria</Label>
              <select
                id="demo-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
              >
                <option value="">Todas</option>
                {DEMO_CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setType("");
                  setCategoryId("");
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </details>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Nome</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo</th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Categoria</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Preço</th>
              <th className="hidden px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">Estoque</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((product) => {
              const isService = product.type === "SERVICE";
              return (
                <tr key={product.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          isService ? "bg-violet-50 text-violet-500" : "bg-blue-50 text-blue-500",
                        )}
                      >
                        {isService ? <Layers className="size-3.5" /> : <Package className="size-3.5" />}
                      </div>
                      <span className="font-semibold text-slate-800">{product.name}</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3.5 md:table-cell">
                    <span className="font-mono text-xs text-slate-500">{product.sku}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={typeBadgeVariant(product.type)}>
                      {PRODUCT_TYPE_LABELS[product.type]}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">{product.category}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-slate-800">
                    {formatMoneyBRL(product.price)}
                  </td>
                  <td className="hidden px-4 py-3.5 text-center text-xs text-slate-500 lg:table-cell">
                    {product.stock == null ? "—" : product.stock}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Badge variant={statusVariant(product.status)}>
                      {PRODUCT_STATUS_LABELS[product.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Button type="button" size="sm" variant="outline" disabled>
                      Ver
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PaginationBar
        page={1}
        pageCount={1}
        total={filtered.length}
        totalLabel="produto(s)"
      />
    </PageContainer>
  );
}
