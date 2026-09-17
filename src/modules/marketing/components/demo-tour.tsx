"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileSpreadsheet,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";
import { cn } from "@/shared/utilities/cn";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "crm", label: "CRM", icon: Users },
  { id: "vendas", label: "Vendas", icon: ShoppingCart },
  { id: "estoque", label: "Estoque", icon: Warehouse },
  { id: "financeiro", label: "Financeiro", icon: CreditCard },
  { id: "compras", label: "Compras", icon: Truck },
  { id: "relatorios", label: "Relatórios", icon: FileSpreadsheet },
  { id: "comunicacoes", label: "Comunicações", icon: MessageSquare },
] as const;

type ScreenId = (typeof NAV)[number]["id"];

function DemoHeader() {
  return (
    <header className="border-b border-white/10 bg-[#0B0F19] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark size={32} className="size-8 rounded-none" />
          <span className="font-semibold">BusinessOS One</span>
        </Link>
        <p className="text-xs text-slate-300 sm:text-sm">
          Demonstração pública com dados de exemplo. Nada aqui usa o banco de produção.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium hover:text-[#60A5FA]">
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-[#3B82F6] px-4 py-2 text-sm font-semibold hover:bg-[#60A5FA]"
          >
            Começar agora
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}

function ScreenDashboard() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Últimos 30 dias · dados de exemplo</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Faturamento", value: "R$ 24.580,00" },
          { label: "Vendas", value: "147" },
          { label: "A receber", value: "R$ 8.420,00" },
          { label: "Estoque baixo", value: "12" },
        ].map((kpi) => (
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
    </div>
  );
}

function ScreenCrm() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cliente</h1>
        <p className="text-sm text-muted-foreground">Visão 360º com histórico, financeiro e atividades</p>
      </div>
      <div className="rounded-md border p-4">
        <div className="flex items-center gap-3 border-b pb-4">
          <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
            A
          </div>
          <div>
            <p className="font-semibold">Ana Costa</p>
            <p className="text-sm text-muted-foreground">Cliente ativo · comercial e financeiro na ficha</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Vendas</p>
            <p className="font-semibold">8</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="font-semibold">R$ 450,00</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Atividades</p>
            <p className="font-semibold">3 abertas</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Venda #1042</span>
            <span>R$ 1.200,00</span>
          </li>
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Pagamento recebido</span>
            <span className="text-emerald-700">Quitada</span>
          </li>
          <li className="flex justify-between rounded-md border px-3 py-2">
            <span>Atividade: retorno comercial</span>
            <span>Concluída</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ScreenVendas() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova venda</h1>
        <p className="text-sm text-muted-foreground">Produto, quantidade, desconto e pagamento</p>
      </div>
      <div className="rounded-md border p-4">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold">Itens</p>
          <span className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">À vista</span>
        </div>
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <Package className="size-8 rounded-md border p-1.5" aria-hidden />
            <div>
              <p className="text-sm font-medium">Consulta / serviço</p>
              <p className="text-xs text-muted-foreground">Estoque atual: 14</p>
            </div>
          </div>
          <p className="text-sm">Qtd 1 · R$ 197,00</p>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>R$ 197,00</dd>
          </div>
          <div className="flex justify-between">
            <dt>Desconto</dt>
            <dd>R$ 0,00</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>Total</dt>
            <dd>R$ 197,00</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ScreenEstoque() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
        <p className="text-sm text-muted-foreground">Entradas, saídas, ajustes, estoque mínimo e alertas</p>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Produto</th>
              <th className="px-3 py-2 font-medium">Qtd</th>
              <th className="px-3 py-2 font-medium">Mínimo</th>
              <th className="px-3 py-2 font-medium">Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-3 py-2">Produto A</td>
              <td className="px-3 py-2">42</td>
              <td className="px-3 py-2">10</td>
              <td className="px-3 py-2">Normal</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2">Produto B</td>
              <td className="px-3 py-2">8</td>
              <td className="px-3 py-2">10</td>
              <td className="px-3 py-2 text-amber-700">Estoque baixo</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Produto C</td>
              <td className="px-3 py-2">0</td>
              <td className="px-3 py-2">5</td>
              <td className="px-3 py-2 text-red-700">Sem estoque</td>
            </tr>
          </tbody>
        </table>
      </div>
      <ul className="grid gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-md border px-3 py-2">Última entrada · +20 unidades</li>
        <li className="rounded-md border px-3 py-2">Saída por venda · −1 unidade</li>
        <li className="rounded-md border px-3 py-2">Ajuste · conferência</li>
        <li className="rounded-md border px-3 py-2">Perda · 1 unidade</li>
      </ul>
    </div>
  );
}

function ScreenFinanceiro() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contas a receber</h1>
        <p className="text-sm text-muted-foreground">Parcelas, pagamento parcial, quitação e vencimentos</p>
      </div>
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
        <li className="flex justify-between rounded-md border px-3 py-2">
          <span>Parcela 1/3 · 10/09/2026</span>
          <span className="text-emerald-700">Quitada</span>
        </li>
        <li className="flex justify-between rounded-md border px-3 py-2">
          <span>Parcela 2/3 · 10/10/2026</span>
          <span className="text-amber-700">Parcial</span>
        </li>
        <li className="flex justify-between rounded-md border px-3 py-2">
          <span>Parcela 3/3 · 10/11/2026</span>
          <span>Pendente</span>
        </li>
      </ul>
    </div>
  );
}

function ScreenCompras() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Compras</h1>
        <p className="text-sm text-muted-foreground">Fornecedores, custos, recebimento e entrada de estoque</p>
      </div>
      <div className="rounded-md border p-4">
        <p className="mb-3 font-semibold">Compra #88 · Fornecedor exemplo</p>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span>Produto A · 20 un.</span>
            <span>R$ 800,00</span>
          </li>
          <li className="flex justify-between">
            <span>Status</span>
            <span>Recebida</span>
          </li>
          <li className="flex justify-between">
            <span>Estoque</span>
            <span>Entrada registrada</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ScreenRelatorios() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Vendas, financeiro, estoque e compras · exportação CSV</p>
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
            <tr className="border-b">
              <td className="px-3 py-2">Vendas concluídas</td>
              <td className="px-3 py-2">30 dias</td>
              <td className="px-3 py-2">147</td>
            </tr>
            <tr className="border-b">
              <td className="px-3 py-2">Recebido</td>
              <td className="px-3 py-2">30 dias</td>
              <td className="px-3 py-2">R$ 18.100,00</td>
            </tr>
            <tr>
              <td className="px-3 py-2">Compras recebidas</td>
              <td className="px-3 py-2">30 dias</td>
              <td className="px-3 py-2">12</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScreenComunicacoes() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comunicações</h1>
        <p className="text-sm text-muted-foreground">Histórico, templates, WhatsApp manual e notificações internas</p>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="rounded-md border px-3 py-3">
          Template: lembrete de parcela · WhatsApp manual
        </li>
        <li className="rounded-md border px-3 py-3">
          Envio registrado para Ana Costa · 16/09/2026
        </li>
        <li className="rounded-md border px-3 py-3">
          Notificação interna: estoque baixo em 12 produtos
        </li>
      </ul>
    </div>
  );
}

function renderScreen(id: ScreenId) {
  switch (id) {
    case "dashboard":
      return <ScreenDashboard />;
    case "crm":
      return <ScreenCrm />;
    case "vendas":
      return <ScreenVendas />;
    case "estoque":
      return <ScreenEstoque />;
    case "financeiro":
      return <ScreenFinanceiro />;
    case "compras":
      return <ScreenCompras />;
    case "relatorios":
      return <ScreenRelatorios />;
    case "comunicacoes":
      return <ScreenComunicacoes />;
  }
}

export function DemoTour() {
  const [screen, setScreen] = useState<ScreenId>("dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <DemoHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col md:flex-row">
        <aside className="border-b bg-card md:w-56 md:shrink-0 md:border-r md:border-b-0">
          <div className="flex items-center gap-2 border-b px-4 py-4">
            <Settings className="size-4 text-muted-foreground" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Empresa exemplo</p>
              <p className="text-xs text-muted-foreground">Somente visualização</p>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col" aria-label="Módulos da demonstração">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = screen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm",
                    active
                      ? "bg-emerald-50 font-medium text-emerald-900"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-4" aria-hidden />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{renderScreen(screen)}</main>
      </div>
      <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
        <p className="mb-3">Gostou do que viu? Crie sua conta e use os dados da sua empresa.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-[#3B82F6] px-5 py-2 font-semibold text-white hover:bg-[#60A5FA]"
          >
            Começar agora
          </Link>
          <Link href="/" className="rounded-full border px-5 py-2 font-semibold hover:bg-muted">
            Voltar à página inicial
          </Link>
        </div>
      </footer>
    </div>
  );
}
