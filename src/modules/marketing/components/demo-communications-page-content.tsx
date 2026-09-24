"use client";

import { useState } from "react";
import { Mail, MessageSquare, Search } from "lucide-react";
import { DEMO_COMMUNICATIONS_HISTORY } from "@/modules/marketing/demo-data";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { ModulePageHeader, PageContainer, PaginationBar } from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { cn } from "@/shared/utilities/cn";

function statusVariant(status: keyof typeof COMMUNICATION_STATUS_LABELS) {
  if (status === "SENT" || status === "DELIVERED") return "success" as const;
  if (status === "FAILED" || status === "CANCELLED") return "destructive" as const;
  if (status === "PREPARED") return "warning" as const;
  return "secondary" as const;
}

export function DemoCommunicationsPageContent() {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState("");

  const filtered = DEMO_COMMUNICATIONS_HISTORY.filter((item) => {
    const matchSearch =
      item.subject.toLowerCase().includes(search.toLowerCase()) ||
      item.customer.toLowerCase().includes(search.toLowerCase());
    const matchChannel = !channel || item.channel === channel;
    return matchSearch && matchChannel;
  });

  return (
    <PageContainer>
      <CommunicationsSubnav variant="demo" active="history" />
      <ModulePageHeader
        title="Comunicações"
        subtitle="8 / 20 comunicações este mês (plano Free)"
        actions={
          <Button type="button" disabled size="sm" className="h-8">
            Nova comunicação
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search
                className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por assunto ou cliente…"
                className="h-9 pl-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="demo-comm-channel">Canal</Label>
              <select
                id="demo-comm-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
              >
                <option value="">Todos</option>
                {Object.entries(COMMUNICATION_CHANNEL_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setChannel("");
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((item) => {
            const Icon = item.channel === "EMAIL" ? Mail : MessageSquare;
            const iconColor =
              item.channel === "WHATSAPP"
                ? "text-emerald-500"
                : item.channel === "EMAIL"
                  ? "text-blue-500"
                  : "text-slate-400";

            return (
              <div
                key={item.id}
                className="flex cursor-default items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                  <Icon className={cn("size-3.5", iconColor)} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{item.subject}</span>
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
                    Para: {item.customer} · {item.author} ·{" "}
                    {COMMUNICATION_ORIGIN_LABELS[item.origin]}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="mb-1 text-xs text-slate-400">{item.createdAt}</div>
                  <Badge variant={statusVariant(item.status)}>
                    {COMMUNICATION_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PaginationBar
        page={1}
        pageCount={1}
        total={filtered.length}
        totalLabel="comunicação(ões)"
      />
    </PageContainer>
  );
}
