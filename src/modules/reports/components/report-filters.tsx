import Link from "next/link";
import {
  PAYMENT_METHOD_LABELS,
  SALE_STATUS_LABELS,
} from "@/modules/sales/lib/sale-labels";
import { RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import { PURCHASE_STATUS_LABELS } from "@/modules/purchases/lib/purchase-labels";
import { PeriodFilter } from "@/modules/reports/components/period-filter";
import type { DateRange } from "@/modules/reports/lib/period";
import type {
  FinanceReportQuery,
  InventoryReportQuery,
  PurchasesReportQuery,
  SalesReportQuery,
} from "@/modules/reports/schemas/reports.schemas";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type Lookups = {
  customers: Array<{ id: string; name: string }>;
  sellers: Array<{ id: string; name: string | null; email: string }>;
  products: Array<{ id: string; name: string; sku: string }>;
  suppliers: Array<{ id: string; name: string }>;
};

function SelectField({
  id,
  label,
  name,
  value,
  options,
}: {
  id: string;
  label: string;
  name: string;
  value?: string | null;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        defaultValue={value ?? ""}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SalesReportFilters({
  range,
  query,
  lookups,
}: {
  range: DateRange;
  query: SalesReportQuery;
  lookups: Lookups;
}) {
  return (
    <PeriodFilter
      action="/app/reports/sales"
      range={range}
      extra={
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SelectField
            id="status"
            label="Status"
            name="status"
            value={query.status}
            options={[
              { value: "COMPLETED", label: SALE_STATUS_LABELS.COMPLETED },
              { value: "CANCELLED", label: SALE_STATUS_LABELS.CANCELLED },
            ]}
          />
          <SelectField
            id="paymentMethod"
            label="Pagamento"
            name="paymentMethod"
            value={query.paymentMethod}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <SelectField
            id="customerId"
            label="Cliente"
            name="customerId"
            value={query.customerId}
            options={lookups.customers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <SelectField
            id="sellerId"
            label="Vendedor"
            name="sellerId"
            value={query.sellerId}
            options={lookups.sellers.map((item) => ({
              value: item.id,
              label: item.name ?? item.email,
            }))}
          />
          <SelectField
            id="productId"
            label="Produto"
            name="productId"
            value={query.productId}
            options={lookups.products.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.sku})`,
            }))}
          />
        </div>
      }
    />
  );
}

export function FinanceReportFilters({
  range,
  query,
  lookups,
}: {
  range: DateRange;
  query: FinanceReportQuery;
  lookups: Lookups;
}) {
  return (
    <PeriodFilter
      action="/app/reports/finance"
      range={range}
      extra={
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="status"
            label="Status"
            name="status"
            value={query.status}
            options={Object.entries(RECEIVABLE_STATUS_LABELS).map(
              ([value, label]) => ({ value, label }),
            )}
          />
          <SelectField
            id="paymentMethod"
            label="Pagamento"
            name="paymentMethod"
            value={query.paymentMethod}
            options={Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <SelectField
            id="customerId"
            label="Cliente"
            name="customerId"
            value={query.customerId}
            options={lookups.customers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </div>
      }
    />
  );
}

export function InventoryReportFilters({ query }: { query: InventoryReportQuery }) {
  return (
    <form
      action="/app/reports/inventory"
      className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:flex-wrap lg:items-end"
    >
      <div className="grid flex-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="q">Produto</Label>
          <Input
            id="q"
            name="q"
            placeholder="Nome, SKU ou código"
            defaultValue={query.q ?? ""}
          />
        </div>
        <SelectField
          id="stock"
          label="Estoque"
          name="stock"
          value={query.stock}
          options={[
            { value: "all", label: "Todos" },
            { value: "low", label: "Abaixo do mínimo" },
            { value: "out", label: "Sem estoque" },
          ]}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">Filtrar</Button>
        <Button asChild variant="outline">
          <Link href="/app/reports/inventory">Limpar</Link>
        </Button>
      </div>
    </form>
  );
}

export function PurchasesReportFilters({
  range,
  query,
  lookups,
}: {
  range: DateRange;
  query: PurchasesReportQuery;
  lookups: Lookups;
}) {
  return (
    <PeriodFilter
      action="/app/reports/purchases"
      range={range}
      extra={
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField
            id="status"
            label="Status"
            name="status"
            value={query.status}
            options={Object.entries(PURCHASE_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <SelectField
            id="supplierId"
            label="Fornecedor"
            name="supplierId"
            value={query.supplierId}
            options={lookups.suppliers.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <SelectField
            id="productId"
            label="Produto"
            name="productId"
            value={query.productId}
            options={lookups.products.map((item) => ({
              value: item.id,
              label: `${item.name} (${item.sku})`,
            }))}
          />
        </div>
      }
    />
  );
}
