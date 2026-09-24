"use client";

import { useState } from "react";
import { DEMO_CATEGORIES } from "@/modules/marketing/demo-data";
import { ProductsSubnav } from "@/modules/products/components/products-subnav";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function DemoCategoriesPageContent() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_CATEGORIES.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer>
      <ProductsSubnav variant="demo" active="categories" />
      <PageHeader
        eyebrow="Produtos"
        title="Categorias"
        description={`Organização do catálogo · ${DEMO_CATEGORIES.length} categoria(s)`}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar categoria…"
          className="h-9 sm:max-w-xs"
        />
        <Button type="button" size="sm" disabled>
          Nova categoria
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Produtos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-semibold text-slate-800">{category.name}</TableCell>
                <TableCell className="text-slate-500">{category.description}</TableCell>
                <TableCell className="text-right text-slate-600">{category.productCount}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" size="sm" variant="outline" disabled>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
