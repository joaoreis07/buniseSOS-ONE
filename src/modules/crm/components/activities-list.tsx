"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  Calendar,
  Mail,
  MessageCircle,
  Phone,
  CheckSquare,
} from "lucide-react";
import type { Activity, ActivityType } from "@prisma/client";
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
import { cn } from "@/shared/utilities/cn";

type ActivityRow = Activity & {
  owner: { id: string; name: string | null; email: string } | null;
  customer?: { id: string; name: string } | null;
  lead?: { id: string; name: string } | null;
  opportunity?: { id: string; name: string } | null;
};

const TYPE_STYLES: Record<
  ActivityType,
  { icon: typeof Phone; className: string }
> = {
  CALL: { icon: Phone, className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  EMAIL: { icon: Mail, className: "bg-blue-50 text-blue-600 border-blue-100" },
  MEETING: { icon: Calendar, className: "bg-violet-50 text-violet-600 border-violet-100" },
  TASK: { icon: CheckSquare, className: "bg-amber-50 text-amber-600 border-amber-100" },
  WHATSAPP: {
    icon: MessageCircle,
    className: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  NOTE: { icon: CheckSquare, className: "bg-slate-100 text-slate-600 border-slate-200" },
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
      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-8 text-center text-sm text-slate-400">
        Nenhuma atividade.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const typeStyle = TYPE_STYLES[item.type] ?? TYPE_STYLES.TASK;
        const Icon = typeStyle.icon;
        const isCompleted = item.status === "COMPLETED";

        return (
          <li
            key={item.id}
            className={cn(
              "flex gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4",
              isCompleted && "opacity-60",
            )}
          >
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                typeStyle.className,
              )}
            >
              <Icon className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/app/crm/activities/${item.id}`}
                  className="font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                >
                  {item.title}
                </Link>
                <Badge variant="outline" className="text-[10px]">
                  {ACTIVITY_TYPE_LABELS[item.type]}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                {ACTIVITY_TYPE_LABELS[item.type]} ·{" "}
                {item.customer?.name ??
                  item.lead?.name ??
                  item.opportunity?.name ??
                  "—"}{" "}
                · {item.owner?.name ?? item.owner?.email ?? "Sem responsável"}
              </p>
              {!compact && item.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>
              ) : null}
              {canManage && !compact ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.status !== "COMPLETED" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[10px]"
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
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-[10px] text-red-600"
                    disabled={pending}
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("activityId", item.id);
                      startTransition(async () => {
                        await deleteActivityAction(undefined, fd);
                      });
                    }}
                  >
                    Excluir
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-slate-500">{formatDateTimeBR(item.dueAt)}</p>
              <Badge
                variant={
                  item.status === "COMPLETED"
                    ? "default"
                    : item.status === "CANCELLED"
                      ? "destructive"
                      : "outline"
                }
                className="mt-1"
              >
                {ACTIVITY_STATUS_LABELS[item.status]}
              </Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
