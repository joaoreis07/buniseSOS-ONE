"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { ProductType } from "@prisma/client";
import {
  createPurchaseAction,
  updatePurchaseAction,
  type PurchaseActionResult,
} from "@/modules/purchases/actions/purchase.actions";
import { computeSaleTotals } from "@/modules/sales/lib/sale-totals";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type CatalogProduct = {
  id: string;
  name: string;
  sku: string;
  type: ProductType;
  costPrice: unknown;
  inventory: { quantity: number } | null;
};

type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitCost: number;
  quantity: number;
};

export function PurchaseForm({
  mode,
  products,
  suppliers,
  purchaseId,
  initialSupplierId,
  initialDiscount,
  initialNotes,
  initialLines,
}: {
  mode: "create" | "edit";
  products: CatalogProduct[];
  suppliers: Array<{ id: string; name: string }>;
  purchaseId?: string;
  initialSupplierId?: string;
  initialDiscount?: string;
  initialNotes?: string;
  initialLines?: CartLine[];
}) {
  const action = mode === "create" ? createPurchaseAction : updatePurchaseAction;
  const [state, formAction, pending] = useActionState<
    PurchaseActionResult | undefined,
    FormData
  >(action, undefined);

  const [query, setQuery] = useState("");
  const [supplierId, setSupplierId] = useState(initialSupplierId ?? "");
  const [discountAmount, setDiscountAmount] = useState(initialDiscount ?? "0");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [lines, setLines] = useState<CartLine[]>(initialLines ?? []);
  const [localError, setLocalError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q),
      )
      .slice(0, 12);
  }, [products, query]);

  function addProduct(product: CatalogProduct) {
    setLocalError(null);
    const unitCost = Number(product.costPrice) || 0;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitCost,
          quantity: 1,
        },
      ];
    });
  }

  const totals = useMemo(() => {
    if (lines.length === 0) {
      return { subtotal: 0, discountAmount: 0, total: 0 };
    }
    try {
      return computeSaleTotals(
        lines.map((line) => ({
          quantity: line.quantity,
          unitPrice: line.unitCost,
          discountAmount: 0,
        })),
        Number(discountAmount) || 0,
      );
    } catch (error) {
      return {
        subtotal: 0,
        discountAmount: 0,
        total: 0,
        error: error instanceof Error ? error.message : "Totais inválidos",
      };
    }
  }, [lines, discountAmount]);

  const itemsPayload = JSON.stringify(
    lines.map((line) => ({
      productId: line.productId,
      quantity: line.quantity,
      unitCost: line.unitCost,
      discountAmount: 0,
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      {purchaseId ? (
        <input type="hidden" name="purchaseId" value={purchaseId} />
      ) : null}
      <input type="hidden" name="items" value={itemsPayload} />
      <input type="hidden" name="supplierId" value={supplierId} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="product-search">Buscar produto físico</Label>
            <Input
              id="product-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome ou SKU"
            />
            <ul className="divide-y rounded-md border">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground">
                  Nenhum produto físico encontrado.
                </li>
              ) : (
                filtered.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku} · custo {formatMoneyBRL(product.costPrice)}
                        {product.inventory
                          ? ` · estoque ${product.inventory.quantity}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addProduct(product)}
                    >
                      Adicionar
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {lines.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Adicione produtos físicos para registrar a compra.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map((line) => (
                    <TableRow key={line.productId}>
                      <TableCell>
                        <div className="font-medium">{line.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {line.sku}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          className="w-20"
                          onChange={(event) => {
                            const quantity = Math.max(
                              1,
                              Math.floor(Number(event.target.value) || 1),
                            );
                            setLines((current) =>
                              current.map((item) =>
                                item.productId === line.productId
                                  ? { ...item, quantity }
                                  : item,
                              ),
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitCost}
                          className="w-28"
                          onChange={(event) => {
                            const unitCost = Number(event.target.value) || 0;
                            setLines((current) =>
                              current.map((item) =>
                                item.productId === line.productId
                                  ? { ...item, unitCost }
                                  : item,
                              ),
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatMoneyBRL(line.unitCost * line.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setLines((current) =>
                              current.filter(
                                (item) => item.productId !== line.productId,
                              ),
                            )
                          }
                        >
                          Remover
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select
              value={supplierId || undefined}
              onValueChange={setSupplierId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountAmount">Desconto geral</Label>
            <Input
              id="discountAmount"
              name="discountAmount"
              type="number"
              min="0"
              step="0.01"
              value={discountAmount}
              onChange={(event) => setDiscountAmount(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="rounded-md border px-3 py-3 text-sm">
            <p className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatMoneyBRL(totals.subtotal)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Desconto</span>
              <span>{formatMoneyBRL(totals.discountAmount)}</span>
            </p>
            <p className="mt-2 flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatMoneyBRL(totals.total)}</span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Totais e estoque são validados no servidor. Serviços não entram nesta
            tela.
          </p>
          {"error" in totals && totals.error ? (
            <Alert variant="destructive">
              <AlertDescription>{totals.error}</AlertDescription>
            </Alert>
          ) : null}
          {localError ? (
            <Alert variant="destructive">
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          ) : null}
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Button
            type="submit"
            name="intent"
            value="draft"
            className="w-full"
            disabled={pending || lines.length === 0 || !supplierId}
          >
            {pending ? "Salvando..." : "Salvar rascunho"}
          </Button>
          {mode === "create" ? (
            <Button
              type="submit"
              name="intent"
              value="receive"
              variant="outline"
              className="w-full"
              disabled={pending || lines.length === 0 || !supplierId}
            >
              {pending ? "Recebendo..." : "Receber compra"}
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
