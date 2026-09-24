import Link from "next/link";
import type { Lead, LeadStatus } from "@prisma/client";
import {
  LEAD_ORIGIN_LABELS,
  LEAD_STATUS_LABELS,
  formatMoneyBRL,
} from "@/modules/crm/lib/lead-labels";
import { formatDateBR } from "@/modules/finance/lib/finance-labels";
import { cn } from "@/shared/utilities/cn";

type LeadRow = Lead & {
  owner: { id: string; name: string | null; email: string } | null;
};

const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-slate-100 text-slate-600",
  CONTACTED: "bg-sky-50 text-sky-700",
  QUALIFIED: "bg-blue-50 text-blue-700",
  UNQUALIFIED: "bg-red-50 text-red-700",
  CONVERTED: "bg-emerald-50 text-emerald-700",
  LOST: "bg-red-50 text-red-700",
};

const SOURCE_COLORS: Record<string, string> = {
  LINKEDIN: "bg-blue-50 text-blue-700",
  INDICATION: "bg-emerald-50 text-emerald-700",
  WEBSITE: "bg-slate-100 text-slate-600",
  INSTAGRAM: "bg-rose-50 text-rose-700",
  GOOGLE: "bg-amber-50 text-amber-700",
};

function sourceColor(origin: string | null) {
  if (!origin) return "bg-slate-100 text-slate-600";
  const key = origin.toUpperCase().replace(/\s+/g, "_");
  for (const [pattern, cls] of Object.entries(SOURCE_COLORS)) {
    if (key.includes(pattern)) return cls;
  }
  return "bg-slate-100 text-slate-600";
}

export function LeadsTable({
  items,
  canManage,
}: {
  items: LeadRow[];
  canManage: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Nenhum lead encontrado.
        {canManage ? (
          <>
            {" "}
            <Link href="/app/crm/leads/new" className="text-[var(--bos-primary)] hover:underline">
              Criar o primeiro
            </Link>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Lead
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 md:table-cell">
              Origem
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estágio
            </th>
            <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">
              Valor est.
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Responsável
            </th>
            <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 lg:table-cell">
              Data
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map((lead) => (
            <tr key={lead.id} className="transition-colors hover:bg-slate-50">
              <td className="px-5 py-3.5">
                <Link
                  href={`/app/crm/leads/${lead.id}`}
                  className="block font-semibold text-slate-800 hover:text-[var(--bos-primary)]"
                >
                  {lead.name}
                </Link>
                {lead.companyName ? (
                  <div className="text-xs text-slate-400">{lead.companyName}</div>
                ) : null}
              </td>
              <td className="hidden px-4 py-3.5 md:table-cell">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    sourceColor(lead.origin),
                  )}
                >
                  {lead.origin ? LEAD_ORIGIN_LABELS[lead.origin] ?? lead.origin : "—"}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-medium",
                    STAGE_COLORS[lead.status] ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                </span>
              </td>
              <td className="hidden px-4 py-3.5 text-right text-xs font-semibold text-slate-700 sm:table-cell">
                {formatMoneyBRL(lead.estimatedValue)}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {lead.owner?.name ?? lead.owner?.email ?? "—"}
              </td>
              <td className="hidden px-4 py-3.5 text-xs text-slate-500 lg:table-cell">
                {formatDateBR(lead.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
