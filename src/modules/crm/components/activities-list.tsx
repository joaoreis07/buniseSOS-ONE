"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Activity } from "@prisma/client";
import {
  deleteActivityAction,
  setActivityStatusAction,
} from "@/modules/crm/actions/activity.actions";
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_TYPE_LABELS,
  formatDateTimeBR,
} from "@/modules/crm/lib/activity-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type ActivityRow = Activity & {
  owner: { id: string; name: string | null; email: string } | null;
  customer?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  opportunity?: { id: string; name: string } | null;
};

export function ActivitiesList({
  items,
  canManage,
  compact = false,
}: {
  items: ActivityRow[];
  canManage: boolean;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        Nenhuma atividade.
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
                <Link
                  href={`/app/crm/activities/${item.id}`}
                  className="font-medium hover:underline"
                >
                  {item.title}
                </Link>
                <Badge variant="secondary">
                  {ACTIVITY_TYPE_LABELS[item.type]}
                </Badge>
                <Badge
                  variant={
                    item.status === "COMPLETED"
                      ? "default"
                      : item.status === "CANCELLED"
                        ? "destructive"
                        : "outline"
                  }
                >
                  {ACTIVITY_STATUS_LABELS[item.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTimeBR(item.dueAt)} ·{" "}
                {item.owner?.name ?? item.owner?.email ?? "Sem responsável"}
              </p>
              {!compact ? (
                <p className="text-xs text-muted-foreground">
                  {item.customer?.name ??
                    item.lead?.name ??
                    item.opportunity?.name ??
                    "—"}
                </p>
              ) : null}
            </div>
            {canManage ? (
              <div className="flex flex-wrap gap-1">
                {item.status !== "COMPLETED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("activityId", item.id);
                      fd.set("status", "COMPLETED");
                      startTransition(async () => {
                        await setActivityStatusAction(fd);
                      });
                    }}
                  >
                    Concluir
                  </Button>
                ) : null}
                {item.status !== "CANCELLED" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("activityId", item.id);
                      fd.set("status", "CANCELLED");
                      startTransition(async () => {
                        await setActivityStatusAction(fd);
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                ) : null}
                <form
                  action={(formData) => {
                    startTransition(async () => {
                      await deleteActivityAction(undefined, formData);
                    });
                  }}
                >
                  <input type="hidden" name="activityId" value={item.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                  >
                    Excluir
                  </Button>
                </form>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
