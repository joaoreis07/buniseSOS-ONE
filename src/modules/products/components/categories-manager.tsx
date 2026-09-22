"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import type { ProductCategory } from "@prisma/client";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryActionResult,
} from "@/modules/products/actions/category.actions";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type CategoryRow = ProductCategory & {
  _count: { products: number };
};

function CategoryEditor({
  mode,
  category,
  onDone,
}: {
  mode: "create" | "edit";
  category?: ProductCategory;
  onDone?: () => void;
}) {
  const action =
    mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, pending] = useActionState<
    CategoryActionResult | undefined,
    FormData
  >(action, undefined);

  useEffect(() => {
    if (state?.ok) onDone?.();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-3 rounded-md border p-4">
      {mode === "edit" && category ? (
        <input type="hidden" name="categoryId" value={category.id} />
      ) : null}
      <div className="space-y-1">
        <Label htmlFor={`name-${mode}-${category?.id ?? "new"}`}>Nome *</Label>
        <Input
          id={`name-${mode}-${category?.id ?? "new"}`}
          name="name"
          required
          defaultValue={category?.name ?? ""}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`description-${mode}-${category?.id ?? "new"}`}>
          Descrição
        </Label>
        <textarea
          id={`description-${mode}-${category?.id ?? "new"}`}
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>
            {mode === "create" ? "Categoria criada." : "Categoria atualizada."}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar categoria"
              : "Salvar"}
        </Button>
        {mode === "edit" && onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  const [state, formAction, pending] = useActionState<
    CategoryActionResult | undefined,
    FormData
  >(deleteCategoryAction, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Excluir esta categoria? (soft delete)")) {
          event.preventDefault();
        }
      }}
      className="space-y-1"
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" size="sm" variant="destructive" disabled={pending}>
        {pending ? "…" : "Excluir"}
      </Button>
    </form>
  );
}

export function CategoriesManager({
  items,
  canManage,
  queryQ,
}: {
  items: CategoryRow[];
  canManage: boolean;
  queryQ?: string | null;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <Label htmlFor="q">Buscar categoria</Label>
          <Input
            id="q"
            name="q"
            placeholder="Nome…"
            defaultValue={queryQ ?? ""}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Filtrar</Button>
          <Button asChild variant="outline">
            <Link href="/app/products/categories">Limpar</Link>
          </Button>
        </div>
      </form>

      {canManage ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Nova categoria</h2>
          <CategoryEditor mode="create" />
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Nenhuma categoria encontrada.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Descrição</TableHead>
                <TableHead>Produtos</TableHead>
                {canManage ? (
                  <TableHead className="text-right">Ações</TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="align-top font-medium">
                    {editingId === category.id ? (
                      <CategoryEditor
                        mode="edit"
                        category={category}
                        onDone={() => setEditingId(null)}
                      />
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell className="hidden align-top text-sm text-muted-foreground md:table-cell">
                    {editingId === category.id
                      ? null
                      : category.description || "—"}
                  </TableCell>
                  <TableCell className="align-top">
                    {category._count.products}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="align-top text-right">
                      {editingId === category.id ? null : (
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingId(category.id)}
                          >
                            Editar
                          </Button>
                          <DeleteCategoryButton categoryId={category.id} />
                        </div>
                      )}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
