"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DEMO_COMMUNICATIONS,
  DEMO_CUSTOMERS,
  DEMO_KPIS,
  DEMO_NOTICE,
  DEMO_PLAN,
  DEMO_PRODUCTS,
  DEMO_PURCHASES,
  DEMO_RECEIVABLES,
  DEMO_REPORT_ROWS,
  DEMO_SALES,
  DEMO_TEAM,
} from "@/modules/marketing/demo-data";
import type { DemoModuleId } from "@/modules/marketing/demo-nav";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/utilities/cn";

function DemoCta() {
  return (
    <section className="mt-8 rounded-lg border bg-card p-5 text-center">
      <p className="text-lg font-semibold">Gostou do que viu?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Crie sua empresa no BusinessOS One.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="bg-[#3B82F6] hover:bg-[#2563EB]">
          <Link href="/register">
            Começar agora
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/sobre">Ver planos e benefícios</Link>
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {DEMO_PLAN.name} · {DEMO_PLAN.price}
      </p>
    </section>
  );
}

function Notice({ children }: { children?: string }) {
  return (
    <p className="rounded-md border border-[#3B82F6]/30 bg-[#EFF6FF] px-3 py-2 text-sm text-[#1E3A8A]">
      {children ?? DEMO_NOTICE}
    </p>
  );
}

function DashboardScreen() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias · dados de exemplo</p>
      </div>
      <Notice />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-md border px-3 py-3">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{kpi.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-md border p-4">
          <h2 className="mb-3 font-semibold">Vendas</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Concluídas</span>
              <span>147</span>
            </li>
            <li className="flex justify-between">
              <span>Ticket médio</span>
              <span>R$ 167,21</span>
            </li>
            <li className="flex justify-between">
              <span>À vista</span>
              <span>98</span>
            </li>
          </ul>
        </section>
        <section className="rounded-md border p-4">
          <h2 className="mb-3 font-semibold">Financeiro e estoque</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Recebido</span>
              <span>R$ 18.100,00</span>
            </li>
            <li className="flex justify-between">
              <span>Itens em estoque</span>
              <span>342</span>
            </li>
            <li className="flex justify-between">
              <span>Compras recebidas</span>
              <span>12</span>
            </li>
          </ul>
        </section>
      </div>
      <DemoCta />
    </div>
  );
}

function CrmScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_CUSTOMERS[0].id);
  const customer = DEMO_CUSTOMERS.find((item) => item.id === selectedId) ?? DEMO_CUSTOMERS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">Clientes, ficha, histórico e atividades</p>
      </div>
      <Notice />
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-2">
          {DEMO_CUSTOMERS.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm",
                  item.id === customer.id ? "border-blue-200 bg-blue-50" : "hover:bg-muted",
                )}
              >
                <span className="font-medium">{item.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{item.status}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-md border p-4">
          <div className="flex items-start justify-between gap-3 border-b pb-4">
            <div>
              <p className="font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
            <Badge variant="secondary">{customer.status}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="font-semibold">{customer.sales}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">A receber</p>
              <p className="font-semibold">{customer.receivable}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Atividades</p>
              <p className="font-semibold">{customer.activities}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {customer.history.map((row) => (
              <li key={row.label} className="flex justify-between rounded-md border px-3 py-2">
                <span>{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <DemoCta />
    </div>
  );
}

function SalesScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_SALES[0].id);
  const [creating, setCreating] = useState(false);
  const [localNote, setLocalNote] = useState<string | null>(null);
  const sale = DEMO_SALES.find((item) => item.id === selectedId) ?? DEMO_SALES[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vendas</h1>
          <p className="text-sm text-muted-foreground">Lista, detalhes, produto e pagamento</p>
        </div>
        <Button type="button" onClick={() => setCreating((open) => !open)}>
          {creating ? "Fechar nova venda" : "Nova venda"}
        </Button>
      </div>
      <Notice />
      {localNote ? <Notice>{localNote}</Notice> : null}
      {creating ? (
        <form
          className="space-y-3 rounded-md border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setLocalNote("Demonstração: a venda não foi gravada. Nenhum dado real foi criado.");
            setCreating(false);
          }}
        >
          <p className="font-semibold">Nova venda (somente demonstração)</p>
          <label className="block text-sm">
            Cliente
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2">
              {DEMO_CUSTOMERS.map((item) => (
                <option key={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Item
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2">
              <option>Consulta / serviço · R$ 197,00</option>
              <option>Produto A · R$ 945,00</option>
            </select>
          </label>
          <label className="block text-sm">
            Pagamento
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2">
              <option>À vista</option>
              <option>Parcelado</option>
            </select>
          </label>
          <div className="flex gap-2">
            <Button type="submit">Registrar na demonstração</Button>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Venda</th>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Total</th>
              <th className="px-3 py-2 font-medium">Pagamento</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_SALES.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="font-medium text-[#2563EB] hover:underline"
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.number}
                  </button>
                </td>
                <td className="px-3 py-2">{item.customer}</td>
                <td className="px-3 py-2">{item.total}</td>
                <td className="px-3 py-2">{item.payment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-md border p-4">
        <p className="font-semibold">Detalhe {sale.number}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Cliente</dt>
            <dd>{sale.customer}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Itens</dt>
            <dd>{sale.items}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Pagamento</dt>
            <dd>{sale.payment}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Status</dt>
            <dd>{sale.status}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>{sale.total}</dd>
          </div>
        </dl>
      </div>
      <DemoCta />
    </div>
  );
}

function InventoryScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PRODUCTS[0].id);
  const product = DEMO_PRODUCTS.find((item) => item.id === selectedId) ?? DEMO_PRODUCTS[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="text-sm text-muted-foreground">Quantidade, mínimo, alertas e movimentações</p>
      </div>
      <Notice />
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium">Qtd</th>
              <th className="px-3 py-2 font-medium">Mínimo</th>
              <th className="px-3 py-2 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_PRODUCTS.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="font-medium text-[#2563EB] hover:underline"
                    onClick={() => setSelectedId(item.id)}
                  >
                    {item.name}
                  </button>
                </td>
                <td className="px-3 py-2">{item.quantity}</td>
                <td className="px-3 py-2">{item.minimum}</td>
                <td className="px-3 py-2">{item.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-md border p-4">
        <p className="font-semibold">{product.name}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {product.movements.map((row) => (
            <li key={row.type} className="flex justify-between rounded-md border px-3 py-2">
              <span>{row.type}</span>
              <span>{row.qty}</span>
            </li>
          ))}
        </ul>
      </div>
      <DemoCta />
    </div>
  );
}

function FinanceScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_RECEIVABLES[0].id);
  const item = DEMO_RECEIVABLES.find((row) => row.id === selectedId) ?? DEMO_RECEIVABLES[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contas a receber</h1>
        <p className="text-sm text-muted-foreground">Parcelas, pagamentos e vencimentos</p>
      </div>
      <Notice />
      <div className="grid grid-cols-3 overflow-hidden rounded-md border text-center text-sm">
        <div className="border-r p-3">
          <p className="text-xs text-muted-foreground">A receber</p>
          <p className="font-semibold">R$ 4.200,00</p>
        </div>
        <div className="border-r p-3">
          <p className="text-xs text-muted-foreground">Recebido</p>
          <p className="font-semibold text-emerald-700">R$ 18.100,00</p>
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground">Vencido</p>
          <p className="font-semibold text-red-700">R$ 350,00</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {DEMO_RECEIVABLES.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => setSelectedId(row.id)}
              className={cn(
                "flex w-full justify-between rounded-md border px-3 py-2 text-left",
                row.id === item.id ? "border-blue-200 bg-blue-50" : "hover:bg-muted",
              )}
            >
              <span>{row.title}</span>
              <span>{row.status}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="rounded-md border p-4 text-sm">
        <p className="font-semibold">{item.title}</p>
        <p className="mt-2">Vencimento: {item.due}</p>
        <p>Valor: {item.amount}</p>
        <p>Status: {item.status}</p>
        <p className="mt-3 text-muted-foreground">
          Pagamento parcial e quitação existem no produto real. Nesta tela, nada é cobrado.
        </p>
      </div>
      <DemoCta />
    </div>
  );
}

function PurchasesScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PURCHASES[0].id);
  const purchase = DEMO_PURCHASES.find((item) => item.id === selectedId) ?? DEMO_PURCHASES[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
        <p className="text-sm text-muted-foreground">Fornecedores, custos e recebimento</p>
      </div>
      <Notice />
      <ul className="space-y-2 text-sm">
        {DEMO_PURCHASES.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={cn(
                "flex w-full justify-between rounded-md border px-3 py-2 text-left",
                item.id === purchase.id ? "border-blue-200 bg-blue-50" : "hover:bg-muted",
              )}
            >
              <span>
                {item.number} · {item.supplier}
              </span>
              <span>{item.status}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="rounded-md border p-4 text-sm">
        <p className="font-semibold">
          {purchase.number} · {purchase.supplier}
        </p>
        <ul className="mt-3 space-y-2">
          <li className="flex justify-between">
            <span>Itens</span>
            <span>{purchase.items}</span>
          </li>
          <li className="flex justify-between">
            <span>Custo</span>
            <span>{purchase.cost}</span>
          </li>
          <li className="flex justify-between">
            <span>Estoque</span>
            <span>{purchase.stock}</span>
          </li>
        </ul>
      </div>
      <DemoCta />
    </div>
  );
}

function ReportsScreen() {
  const [period, setPeriod] = useState("30");
  const rows = useMemo(
    () =>
      period === "7"
        ? DEMO_REPORT_ROWS.map((row) => ({
            ...row,
            period: row.period === "hoje" ? "hoje" : "7 dias",
          }))
        : DEMO_REPORT_ROWS,
    [period],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Vendas, financeiro, estoque e compras</p>
      </div>
      <Notice />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={period === "7" ? "default" : "outline"}
          onClick={() => setPeriod("7")}
        >
          7 dias
        </Button>
        <Button
          type="button"
          variant={period === "30" ? "default" : "outline"}
          onClick={() => setPeriod("30")}
        >
          30 dias
        </Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Indicador</th>
              <th className="px-3 py-2 font-medium">Período</th>
              <th className="px-3 py-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.indicator} className="border-b last:border-0">
                <td className="px-3 py-2">{row.indicator}</td>
                <td className="px-3 py-2">{row.period}</td>
                <td className="px-3 py-2">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        No produto real os relatórios exportam CSV. Aqui o filtro só troca o rótulo do período.
      </p>
      <DemoCta />
    </div>
  );
}

function CommunicationsScreen() {
  const [tab, setTab] = useState<"history" | "templates" | "notifications">("history");
  const [note, setNote] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicações</h1>
        <p className="text-sm text-muted-foreground">Histórico, templates e notificações</p>
      </div>
      <Notice />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "history" ? "default" : "outline"} onClick={() => setTab("history")}>
          Histórico
        </Button>
        <Button
          type="button"
          variant={tab === "templates" ? "default" : "outline"}
          onClick={() => setTab("templates")}
        >
          Templates
        </Button>
        <Button
          type="button"
          variant={tab === "notifications" ? "default" : "outline"}
          onClick={() => setTab("notifications")}
        >
          Notificações
        </Button>
      </div>
      {note ? <Notice>{note}</Notice> : null}
      <ul className="space-y-2 text-sm">
        {DEMO_COMMUNICATIONS.filter((item) => {
          if (tab === "templates") return item.id === "demo-comm-1";
          if (tab === "notifications") return item.id === "demo-comm-3";
          return true;
        }).map((item) => (
          <li key={item.id} className="rounded-md border px-3 py-3">
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground">{item.detail}</p>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        onClick={() => setNote("Demonstração: nenhum WhatsApp foi enviado.")}
      >
        WhatsApp manual (demonstração)
      </Button>
      <DemoCta />
    </div>
  );
}

function TeamScreen() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
        <p className="text-sm text-muted-foreground">Membros, funções e convites</p>
      </div>
      <Notice />
      <ul className="space-y-2 text-sm">
        {DEMO_TEAM.map((member) => (
          <li key={member.id} className="flex justify-between rounded-md border px-3 py-2">
            <span>
              {member.name} · {member.role}
            </span>
            <span>{member.status}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        Permissões e convites existem no produto real, em Configurações. Esta lista é só visual.
      </p>
      <DemoCta />
    </div>
  );
}

export function DemoScreen({ module }: { module: DemoModuleId }) {
  switch (module) {
    case "dashboard":
      return <DashboardScreen />;
    case "crm":
      return <CrmScreen />;
    case "sales":
      return <SalesScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "finance":
      return <FinanceScreen />;
    case "purchases":
      return <PurchasesScreen />;
    case "reports":
      return <ReportsScreen />;
    case "communications":
      return <CommunicationsScreen />;
    case "team":
      return <TeamScreen />;
  }
}
