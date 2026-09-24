import Link from "next/link";
import { Mail, MessageSquare } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { EmptyState } from "@/shared/components/page-layout";
import type { LucideIcon } from "lucide-react";

type Item = {
  id: string;
  createdAt: Date;
  channel: keyof typeof COMMUNICATION_CHANNEL_LABELS;
  type: keyof typeof COMMUNICATION_TYPE_LABELS;
  status: keyof typeof COMMUNICATION_STATUS_LABELS;
  origin: keyof typeof COMMUNICATION_ORIGIN_LABELS;
  subject: string | null;
  customer: { id: string; name: string } | null;
  user: { name: string | null; email: string | null };
};

const CHANNEL_ICONS: Partial<
  Record<keyof typeof COMMUNICATION_CHANNEL_LABELS, LucideIcon>
> = {
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
};

function statusVariant(status: keyof typeof COMMUNICATION_STATUS_LABELS) {
  if (status === "SENT" || status === "DELIVERED") return "success" as const;
  if (status === "FAILED" || status === "CANCELLED") return "destructive" as const;
  if (status === "PREPARED") return "warning" as const;
  return "secondary" as const;
}

export function CommunicationsTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhuma comunicação encontrada"
        description="Ajuste os filtros ou prepare uma nova mensagem."
      />
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const Icon = CHANNEL_ICONS[item.channel] ?? MessageSquare;
        const iconColor =
          item.channel === "WHATSAPP"
            ? "text-emerald-500"
            : item.channel === "EMAIL"
              ? "text-blue-500"
              : "text-slate-400";

        return (
          <Link
            key={item.id}
            href={`/app/communications/${item.id}`}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 transition-all hover:border-slate-300"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
              <Icon className={`size-3.5 ${iconColor}`} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">
                  {item.subject || "Sem assunto"}
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">
                  {COMMUNICATION_CHANNEL_LABELS[item.channel]}
                </span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">
                  {COMMUNICATION_TYPE_LABELS[item.type]}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-slate-400">
                Para: {item.customer?.name ?? "—"} ·{" "}
                {item.user.name ?? item.user.email ?? "—"} ·{" "}
                {COMMUNICATION_ORIGIN_LABELS[item.origin]}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="mb-1 text-xs text-slate-400">
                {formatDateTimeBR(item.createdAt)}
              </div>
              <Badge variant={statusVariant(item.status)}>
                {COMMUNICATION_STATUS_LABELS[item.status]}
              </Badge>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
