"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  CreditCard,
  MessageSquare,
  Minus,
  Package,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import {
  DEMO_COMMUNICATIONS,
  DEMO_CUSTOMERS,
  DEMO_KPIS,
  DEMO_PLAN,
  DEMO_PRODUCTS,
  DEMO_PURCHASES,
  DEMO_RECEIVABLES,
  DEMO_REPORT_ROWS,
  DEMO_SALES,
  DEMO_TEAM,
} from "@/modules/marketing/demo-data";
import type { DemoModuleId } from "@/modules/marketing/demo-nav";
import {
  DemoCta,
  DemoDetailPanel,
  DemoNotice,
  DemoSectionTabs,
  DemoToolbar,
} from "@/modules/marketing/components/demo-ui";
import {
  DataTableShell,
  FilterBar,
  PageContainer,
  PageHeader,
  SectionCard,
  StatCard,
} from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { cn } from "@/shared/utilities/cn";

function statusBadge(status: string) {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("conclu") ||
    normalized.includes("ativo") ||
    normalized.includes("pago") ||
    normalized.includes("recebid") ||
    normalized.includes("quitad")
  ) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (
    normalized.includes("baixo") ||
    normalized.includes("rascunho") ||
    normalized.includes("pend") ||
    normalized.includes("parcial")
  ) {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (
    normalized.includes("sem estoque") ||
    normalized.includes("vencid") ||
    normalized.includes("inativo")
  ) {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function DashboardScreen() {
  return (
    <PageContainer>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Últimos 30 dias · dados de exemplo"
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DEMO_KPIS.map((kpi, index) => {
          const icons = [CircleDollarSign, ShoppingBag, Wallet, Warehouse] as const;
          const tones = ["blue", "emerald", "amber", "rose"] as const;
          const Icon = icons[index] ?? CircleDollarSign;
          return (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint="Dados fictícios"
              icon={Icon}
              tone={tones[index] ?? "blue"}
            />
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Vendas" description="Resumo operacional do período">
          <ul className="demo-metric-list">
            {[
              ["Concluídas", "147"],
              ["Ticket médio", "R$ 167,21"],
              ["À vista", "98"],
            ].map(([label, value]) => (
              <li key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Financeiro e estoque" description="Indicadores conectados">
          <ul className="demo-metric-list">
            {[
              ["Recebido", "R$ 18.100,00"],
              ["Itens em estoque", "342"],
              ["Compras recebidas", "12"],
            ].map(([label, value]) => (
              <li key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
      <SectionCard title="Desempenho" description="Visão clara para agir mais rápido">
        <div className="demo-chart">
          {[68, 42, 84, 54, 91, 63, 76].map((height, index) => (
            <div key={index} style={{ height: `${height}%` }} aria-hidden />
          ))}
        </div>
      </SectionCard>
      <DemoCta />
    </PageContainer>
  );
}

function CrmScreen() {
  const [tab, setTab] = useState("clients");
  const [selectedId, setSelectedId] = useState<string>(DEMO_CUSTOMERS[0].id);
  const customer = DEMO_CUSTOMERS.find((item) => item.id === selectedId) ?? DEMO_CUSTOMERS[0];

  return (
    <PageContainer>
      <DemoSectionTabs
        active={tab}
        onChange={setTab}
        items={[
          { id: "overview", label: "Dashboard" },
          { id: "clients", label: "Clientes" },
        ]}
      />
      <PageHeader
        eyebrow="CRM"
        title={tab === "overview" ? "Visão geral" : "Clientes"}
        description={
          tab === "overview"
            ? "Indicadores comerciais · dados de exemplo"
            : "Ficha, histórico e atividades — dados de exemplo"
        }
      />
      <DemoNotice />

      {tab === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Clientes" value={DEMO_CUSTOMERS.length} icon={Users} tone="blue" />
            <StatCard label="Ativos" value="2" icon={Users} tone="emerald" />
            <StatCard label="A receber" value="R$ 2.340,00" icon={CircleDollarSign} tone="amber" />
            <StatCard label="Atividades" value="4" icon={MessageSquare} tone="slate" />
          </div>
          <SectionCard title="Clientes recentes" description="Últimas interações comerciais">
            <ul className="demo-metric-list">
              {DEMO_CUSTOMERS.map((item) => (
                <li key={item.id}>
                  <span>{item.name}</span>
                  <strong>{item.receivable}</strong>
                </li>
              ))}
            </ul>
          </SectionCard>
        </>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[18rem_1fr]">
          <SectionCard title="Lista" description={`${DEMO_CUSTOMERS.length} clientes`}>
            <ul className="space-y-2">
              {DEMO_CUSTOMERS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "demo-list-item w-full",
                      item.id === customer.id && "is-active",
                    )}
                  >
                    <span className="demo-avatar">{item.name.slice(0, 2).toUpperCase()}</span>
                    <span className="min-w-0 text-left">
                      <span className="block truncate text-sm font-semibold text-slate-950">
                        {item.name}
                      </span>
                      <span className="block text-xs text-slate-500">{item.status}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="demo-avatar demo-avatar--lg bg-blue-600 text-white">
                  {customer.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
                    {customer.name}
                  </p>
                  <p className="text-sm text-slate-500">{customer.phone}</p>
                </div>
              </div>
              {statusBadge(customer.status)}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <StatCard label="Vendas" value={customer.sales} icon={ShoppingBag} tone="blue" />
              <StatCard
                label="A receber"
                value={customer.receivable}
                icon={CircleDollarSign}
                tone="amber"
              />
              <StatCard label="Atividades" value={customer.activities} icon={Users} tone="emerald" />
            </div>

            <ul className="demo-metric-list mt-5">
              {customer.history.map((row) => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      )}
      <DemoCta />
    </PageContainer>
  );
}

function NewSaleDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const [qty, setQty] = useState(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5 text-left">
          <DialogTitle>Nova venda</DialogTitle>
          <DialogDescription>
            Somente demonstração — nenhum dado real será gravado
          </DialogDescription>
        </DialogHeader>
        <div className="grid lg:grid-cols-[1fr_17rem]">
          <div className="space-y-4 border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
            <label className="block text-sm font-medium text-slate-700">
              Cliente
              <select className="mt-1.5 w-full rounded-xl border border-input bg-white px-3 py-2.5 text-sm shadow-sm">
                {DEMO_CUSTOMERS.map((item) => (
                  <option key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Produtos
              </p>
              <div className="demo-sale-line">
                <div>
                  <strong>Consulta / serviço</strong>
                  <small>SKU-DEMO-001</small>
                </div>
                <div className="demo-sale-qty">
                  <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))}>
                    <Minus className="size-3.5" />
                  </button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty((value) => value + 1)}>
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <strong>R$ {(197 * qty).toLocaleString("pt-BR")}</strong>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-6">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                Pagamento
              </p>
              <div className="space-y-2">
                {["PIX", "Dinheiro", "Cartão", "Parcelado"].map((method, index) => (
                  <label
                    key={method}
                    className={cn("demo-payment-option", index === 0 && "is-active")}
                  >
                    <input type="radio" name="payment" defaultChecked={index === 0} />
                    {method}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-auto space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>R$ {(197 * qty).toLocaleString("pt-BR")}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-950">
                <span>Total</span>
                <span className="text-lg text-blue-700">
                  R$ {(197 * qty).toLocaleString("pt-BR")}
                </span>
              </div>
              <Button
                className="mt-2 w-full rounded-xl"
                onClick={() => {
                  onSubmit();
                  onOpenChange(false);
                }}
              >
                Finalizar venda
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SalesScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_SALES[0].id);
  const [creating, setCreating] = useState(false);
  const [localNote, setLocalNote] = useState<string | null>(null);
  const sale = DEMO_SALES.find((item) => item.id === selectedId) ?? DEMO_SALES[0];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Vendas"
        description="Lista, detalhes, produtos e pagamento — demonstração"
        actions={
          <Button type="button" className="rounded-xl" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nova venda
          </Button>
        }
      />
      <DemoNotice />
      {localNote ? <DemoNotice>{localNote}</DemoNotice> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Vendas no período" value="147" icon={ShoppingBag} tone="blue" hint="Dados fictícios" />
        <StatCard label="Faturamento" value="R$ 24.580,00" icon={CircleDollarSign} tone="emerald" hint="Dados fictícios" />
        <StatCard label="Ticket médio" value="R$ 167,21" icon={Package} tone="amber" hint="Dados fictícios" />
      </div>

      <DemoToolbar placeholder="Buscar venda, cliente…" />

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_SALES.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn("cursor-pointer", item.id === sale.id && "bg-blue-50/80")}
                  onClick={() => setSelectedId(item.id)}
                >
                  <TableCell>
                    <span className="font-mono text-sm font-bold text-blue-700">{item.number}</span>
                  </TableCell>
                  <TableCell className="font-medium">{item.customer}</TableCell>
                  <TableCell className="text-slate-500">{item.items}</TableCell>
                  <TableCell className="text-slate-500">{item.payment}</TableCell>
                  <TableCell className="font-semibold tracking-[-0.02em]">{item.total}</TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>

        <DemoDetailPanel title={`Detalhe ${sale.number}`} description="Selecionado na lista">
          <dl className="demo-detail-list">
            {[
              ["Cliente", sale.customer],
              ["Itens", sale.items],
              ["Pagamento", sale.payment],
              ["Status", sale.status],
              ["Total", sale.total],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className={label === "Total" ? "text-blue-700" : undefined}>{value}</dd>
              </div>
            ))}
          </dl>
        </DemoDetailPanel>
      </div>

      <NewSaleDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={() =>
          setLocalNote("Demonstração: a venda não foi gravada. Nenhum dado real foi criado.")
        }
      />
      <DemoCta />
    </PageContainer>
  );
}

function InventoryScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PRODUCTS[0].id);
  const product = DEMO_PRODUCTS.find((item) => item.id === selectedId) ?? DEMO_PRODUCTS[0];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Estoque"
        description="Quantidade, mínimo, alertas e movimentações"
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Produtos" value={DEMO_PRODUCTS.length} icon={Package} tone="blue" />
        <StatCard
          label="Estoque baixo"
          value={DEMO_PRODUCTS.filter((item) => item.level.includes("baixo")).length}
          icon={Warehouse}
          tone="amber"
        />
        <StatCard
          label="Sem estoque"
          value={DEMO_PRODUCTS.filter((item) => item.quantity === 0).length}
          icon={Boxes}
          tone="rose"
        />
      </div>

      <DemoToolbar placeholder="Buscar produto, SKU…" />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Qtd</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DEMO_PRODUCTS.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn("cursor-pointer", item.id === product.id && "bg-blue-50/80")}
                  onClick={() => setSelectedId(item.id)}
                >
                  <TableCell>
                    <span className="font-semibold text-blue-700">{item.name}</span>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.minimum}</TableCell>
                  <TableCell>{statusBadge(item.level)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>

        <DemoDetailPanel title={product.name} description="Movimentações de exemplo">
          <ul className="demo-metric-list">
            {product.movements.map((row) => (
              <li key={`${row.type}-${row.qty}`}>
                <span>{row.type}</span>
                <strong>{row.qty}</strong>
              </li>
            ))}
          </ul>
        </DemoDetailPanel>
      </div>
      <DemoCta />
    </PageContainer>
  );
}

function FinanceScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_RECEIVABLES[0].id);
  const item = DEMO_RECEIVABLES.find((row) => row.id === selectedId) ?? DEMO_RECEIVABLES[0];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Gestão"
        title="Financeiro"
        description="Contas a receber, parcelas e vencimentos"
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="A receber" value="R$ 4.200,00" icon={CircleDollarSign} tone="blue" />
        <StatCard label="Recebido" value="R$ 18.100,00" icon={Wallet} tone="emerald" />
        <StatCard label="Vencido" value="R$ 350,00" icon={CircleDollarSign} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Parcelas" description="Selecione para ver o detalhe">
          <ul className="space-y-2">
            {DEMO_RECEIVABLES.map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={cn(
                    "demo-list-item w-full justify-between",
                    row.id === item.id && "is-active",
                  )}
                >
                  <span className="font-medium text-slate-900">{row.title}</span>
                  {statusBadge(row.status)}
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <DemoDetailPanel title={item.title} description="Detalhe da parcela (demonstração)">
          <dl className="demo-detail-list">
            {[
              ["Vencimento", item.due],
              ["Valor", item.amount],
              ["Status", item.status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Pagamento parcial e quitação existem no produto real. Nesta tela, nada é cobrado.
          </p>
        </DemoDetailPanel>
      </div>
      <DemoCta />
    </PageContainer>
  );
}

function PurchasesScreen() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_PURCHASES[0].id);
  const purchase = DEMO_PURCHASES.find((item) => item.id === selectedId) ?? DEMO_PURCHASES[0];

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Operação"
        title="Compras"
        description="Fornecedores, custos e recebimento"
      />
      <DemoNotice />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Compras" value={DEMO_PURCHASES.length} icon={Package} tone="blue" />
        <StatCard label="Recebidas" value="1" icon={Boxes} tone="emerald" />
        <StatCard label="Valor comprado" value="R$ 1.220,00" icon={CircleDollarSign} tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Pedidos" description={`${DEMO_PURCHASES.length} compras de exemplo`}>
          <ul className="space-y-2">
            {DEMO_PURCHASES.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "demo-list-item w-full justify-between",
                    item.id === purchase.id && "is-active",
                  )}
                >
                  <span>
                    <span className="block font-semibold text-slate-950">{item.number}</span>
                    <span className="text-xs text-slate-500">{item.supplier}</span>
                  </span>
                  {statusBadge(item.status)}
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>

        <DemoDetailPanel
          title={`${purchase.number} · ${purchase.supplier}`}
          description="Detalhe da compra"
        >
          <ul className="demo-metric-list">
            {[
              ["Itens", purchase.items],
              ["Custo", purchase.cost],
              ["Estoque", purchase.stock],
            ].map(([label, value]) => (
              <li key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </li>
            ))}
          </ul>
        </DemoDetailPanel>
      </div>
      <DemoCta />
    </PageContainer>
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
    <PageContainer>
      <PageHeader
        eyebrow="Gestão"
        title="Relatórios"
        description="Vendas, financeiro, estoque e compras"
      />
      <DemoNotice />
      <FilterBar>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={period === "7" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setPeriod("7")}
          >
            7 dias
          </Button>
          <Button
            type="button"
            variant={period === "30" ? "default" : "outline"}
            className="rounded-xl"
            onClick={() => setPeriod("30")}
          >
            30 dias
          </Button>
        </div>
      </FilterBar>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Indicador</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.indicator}>
                <TableCell className="font-medium">{row.indicator}</TableCell>
                <TableCell>{row.period}</TableCell>
                <TableCell className="font-semibold tracking-[-0.02em]">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>
      <p className="text-xs text-slate-500">
        No produto real os relatórios exportam CSV. Aqui o filtro só troca o rótulo do período.
      </p>
      <DemoCta />
    </PageContainer>
  );
}

function CommunicationsScreen() {
  const [tab, setTab] = useState<"history" | "templates">("history");
  const [note, setNote] = useState<string | null>(null);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Relacionamento"
        title="Comunicações"
        description="Histórico, templates e WhatsApp manual"
      />
      <DemoNotice />
      {note ? <DemoNotice>{note}</DemoNotice> : null}

      <DemoSectionTabs
        active={tab}
        onChange={(value) => setTab(value as "history" | "templates")}
        items={[
          { id: "history", label: "Histórico" },
          { id: "templates", label: "Templates" },
        ]}
      />

      <div className="grid gap-3">
        {DEMO_COMMUNICATIONS.filter((item) => {
          if (tab === "templates") return item.id === "demo-comm-1";
          return item.id !== "demo-comm-3";
        }).map((item) => (
          <SectionCard key={item.id}>
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <MessageSquare className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="rounded-xl"
        onClick={() => setNote("Demonstração: nenhum WhatsApp foi enviado.")}
      >
        WhatsApp manual (demonstração)
      </Button>
      <DemoCta />
    </PageContainer>
  );
}

function SettingsScreen() {
  const [section, setSection] = useState("empresa");

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Administração"
        title="Configurações"
        description="Empresa, equipe, permissões e assinatura"
      />
      <DemoNotice />

      <div className="grid gap-5 lg:grid-cols-[15rem_1fr]">
        <SectionCard className="p-3">
          <nav className="space-y-1">
            {[
              { id: "empresa", label: "Empresa" },
              { id: "equipe", label: "Equipe" },
              { id: "permissoes", label: "Permissões" },
              { id: "assinatura", label: "Assinatura" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "demo-settings-link w-full",
                  section === item.id && "is-active",
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </SectionCard>

        <SectionCard>
          {section === "empresa" ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-950">Empresa</h2>
              <dl className="demo-detail-list">
                {[
                  ["Nome", "Empresa Exemplo Ltda."],
                  ["Documento", "00.000.000/0001-00"],
                  ["Telefone", "(11) 3000-0000"],
                  ["E-mail", "contato@empresaexemplo.com.br"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {section === "equipe" ? (
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-950">Equipe</h2>
              {DEMO_TEAM.map((member) => (
                <div key={member.id} className="demo-list-item justify-between">
                  <div className="flex items-center gap-3">
                    <span className="demo-avatar">{member.name.slice(0, 2).toUpperCase()}</span>
                    <span>
                      <span className="block font-semibold text-slate-950">{member.name}</span>
                      <span className="text-sm text-slate-500">{member.role}</span>
                    </span>
                  </div>
                  {statusBadge(member.status)}
                </div>
              ))}
            </div>
          ) : null}

          {section === "permissoes" ? (
            <div className="space-y-4">
              <h2 className="font-semibold text-slate-950">Permissões</h2>
              <p className="text-sm text-slate-500">
                Matriz fixa por papel — somente visualização na demonstração.
              </p>
              <div className="demo-permissions">
                {["CRM", "Vendas", "Estoque", "Financeiro", "Configurações"].map((module) => (
                  <div key={module}>
                    <span>{module}</span>
                    <ShieldCheck className="size-4 text-blue-600" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {section === "assinatura" ? (
            <div className="demo-billing">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600">
                  Assinatura
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  {DEMO_PLAN.name}
                </h2>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-blue-700">
                  {DEMO_PLAN.price}
                </p>
                <Badge variant="success" className="mt-3">
                  Assinatura ativa
                </Badge>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <CreditCard className="mb-2 size-5 text-blue-600" />
                Cobrança via Asaas. A fatura abre em ambiente externo — sem checkout interno fictício.
              </div>
            </div>
          ) : null}
        </SectionCard>
      </div>
      <DemoCta />
    </PageContainer>
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
    case "settings":
      return <SettingsScreen />;
  }
}
