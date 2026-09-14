import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { EmptyBlock } from "@/modules/reports/components/kpi-card";

export function MoneyBarList({
  items,
  empty,
}: {
  items: Array<{ key: string; label: string; value: number; hint?: string }>;
  empty: string;
}) {
  const max = items.reduce((highest, item) => Math.max(highest, item.value), 0);
  if (items.length === 0 || max <= 0) {
    return <EmptyBlock>{empty}</EmptyBlock>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const width = max > 0 ? Math.max(4, (item.value / max) * 100) : 0;
        return (
          <li key={item.key} className="space-y-1">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatMoneyBRL(item.value)}
                {item.hint ? ` · ${item.hint}` : ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
