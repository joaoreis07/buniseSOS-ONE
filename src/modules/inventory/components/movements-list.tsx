import type { InventoryMovement } from "@prisma/client";
import {
  INVENTORY_MOVEMENT_LABELS,
  formatDateTimeBR,
} from "@/modules/inventory/lib/inventory-labels";
import { Badge } from "@/shared/ui/badge";

type MovementRow = InventoryMovement & {
  createdBy: { id: string; name: string | null; email: string } | null;
};

export function MovementsList({ items }: { items: MovementRow[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhuma movimentação registrada.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-md border px-3 py-3 text-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{INVENTORY_MOVEMENT_LABELS[item.type]}</Badge>
                <span className="font-medium">Qtd {item.quantity}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTimeBR(item.createdAt)} ·{" "}
                {item.createdBy?.name ?? item.createdBy?.email ?? "Sistema"}
              </p>
              {item.reason ? (
                <p className="text-xs">Motivo: {item.reason}</p>
              ) : null}
              {item.notes ? (
                <p className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {item.notes}
                </p>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
