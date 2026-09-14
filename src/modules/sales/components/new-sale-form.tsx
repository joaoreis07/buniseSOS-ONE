"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import type { ProductType } from "@prisma/client";
import {
  completeSaleAction,
  type SaleActionResult,
} from "@/modules/sales/actions/sale.actions";
import { computeSaleTotals } from "@/modules/sales/lib/sale-totals";
import {
  PAYMENT_METHOD_LABELS,
  formatMoneyBRL,
} from "@/modules/sales/lib/sale-labels";
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
  salePrice: unknown;
  inventory: { quantity: number } | null;
};

type CartLine = {
  productId: string;
  name: string;
  sku: string;
  type: ProductType;
  unitPrice: number;
  quantity: number;
  stock: number | null;
};

export function NewSaleForm({
  products,
  customers,
  defaultCustomerId,
}: {
  products: CatalogProduct[];
  customers: Array<{ id: string; name: string }>;
  defaultCustomerId?: string;
}) {
  const [state, formAction, pending] = useActionState<
    SaleActionResult | undefined,
    FormData
  >(completeSaleAction, undefined);

  const [query, setQuery] = useState("");
  const [customerId, setCustomerId] = useState(
    defaultCustomerId && customers.some((item) => item.id === defaultCustomerId)
      ? defaultCustomerId
      : "",
  );
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [installmentsCount, setInstallmentsCount] = useState("2");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [period, setPeriod] = useState("MONTHLY");
  const [discountAmount, setDiscountAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<CartLine[]>([]);
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
    const unitPrice = Number(product.salePrice);
    const stock =
      product.type === "PRODUCT" ? (product.inventory?.quantity ?? 0) : null;
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        if (stock != null && nextQty > stock) {
          setLocalError(`Estoque insuficiente para ${product.name}`);
          return current;
        }
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: nextQty }
            : line,
        );
      }
      if (stock != null && stock < 1) {
        setLocalError(`Sem estoque para ${product.name}`);
        return current;
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          type: product.type,
          unitPrice,
          quantity: 1,
          stock,
        },
      ];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setLocalError(null);
    setLines((current) =>
      current.map((line) => {
        if (line.productId !== productId) return line;
        const next = Math.max(1, Math.floor(quantity) || 1);
        if (line.stock != null && next > line.stock) {
          setLocalError(`Estoque insuficiente para ${line.name}`);
          return { ...line, quantity: line.stock };
        }
        return { ...line, quantity: next };
      }),
    );
  }

  function removeLine(productId: string) {
    setLines((current) => current.filter((line) => line.productId !== productId));
  }

  const totals = useMemo(() => {
    if (lines.length === 0) {
      return { subtotal: 0, discountAmount: 0, total: 0 };
    }
    try {
      return computeSaleTotals(
        lines.map((line) => ({
          quantity: line.quantity,
          unitPrice: line.unitPrice,
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
      discountAmount: 0,
    })),
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="items" value={itemsPayload} />
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="paymentMode" value={paymentMode} />
      <input type="hidden" name="installmentsCount" value={installmentsCount} />
      <input type="hidden" name="firstDueDate" value={firstDueDate} />
      <input type="hidden" name="period" value={period} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="product-search">Buscar produto</Label>
            <Input
              id="product-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nome ou SKU"
            />
            <ul className="divide-y rounded-md border">
              {filtered.length === 0 ? (
                <li className="px-3 py-4 text-sm text-muted-foreground">
                  Nenhum produto encontrado.
                </li>
              ) : (
                filtered.map((product) => {
                  const stock =
                    product.type === "PRODUCT"
                      ? (product.inventory?.quantity ?? 0)
                      : null;
                  return (
                    <li
                      key={product.id}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.sku} · {formatMoneyBRL(product.salePrice)}
                          {stock != null ? ` · estoque ${stock}` : " · serviço"}
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
                  );
                })
              )}
            </ul>
          </div>

          {lines.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Adicione produtos para iniciar a venda.
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit.</TableHead>
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
                          {line.stock != null
                            ? ` · disponível ${line.stock}`
                            : " · serviço"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={line.stock ?? undefined}
                          value={line.quantity}
                          className="w-20"
                          onChange={(event) =>
                            setQuantity(line.productId, Number(event.target.value))
                          }
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {formatMoneyBRL(line.unitPrice)}
                      </TableCell>
                      <TableCell>
                        {formatMoneyBRL(line.unitPrice * line.quantity)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLine(line.productId)}
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
            <Label>Cliente</Label>
            <Select
              value={customerId || "none"}
              onValueChange={(value) =>
                setCustomerId(value === "none" ? "" : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Venda sem cliente</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Condição</Label>
            <Select value={paymentMode} onValueChange={setPaymentMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">À vista</SelectItem>
                <SelectItem value="INSTALLMENT">Parcelado / a prazo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentMode === "INSTALLMENT" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="installmentsCount">Parcelas</Label>
                <Input id="installmentsCount" type="number" min="1" max="120" value={installmentsCount} onChange={(event) => setInstallmentsCount(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstDueDate">Primeiro vencimento</Label>
                <Input id="firstDueDate" type="date" required value={firstDueDate} onChange={(event) => setFirstDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Periodicidade</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
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
            {paymentMode === "CASH"
              ? "Uma conta e uma parcela quitada serão registradas automaticamente."
              : "As parcelas serão calculadas no servidor, com ajuste determinístico dos centavos."}
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
            className="w-full"
            disabled={pending || lines.length === 0}
          >
            {pending ? "Concluindo..." : "Concluir venda"}
          </Button>
        </div>
      </div>
    </form>
  );
}
