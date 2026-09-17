import {
  Activity,
  BarChart3,
  CreditCard,
  Package,
  ShoppingCart,
  Users,
  Warehouse,
} from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";

function WindowChrome({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 bg-[#0B0F19]/70 px-4 py-3">
      <div className="flex gap-1.5" aria-hidden>
        <span className="size-2.5 rounded-full bg-red-500/80" />
        <span className="size-2.5 rounded-full bg-yellow-500/80" />
        <span className="size-2.5 rounded-full bg-emerald-500/80" />
      </div>
      <p className="rounded-full bg-black/40 px-3 py-1 text-[11px] text-slate-400">{title}</p>
      <span className="w-10" />
    </div>
  );
}

function Hero() {
  return (
    <div className="relative mt-4 lg:mt-0">
      <div className="absolute inset-0 rounded-full bg-[#3B82F6]/20 blur-[90px]" aria-hidden />
      <div className="landing-glass relative rounded-2xl p-2 shadow-2xl">
        <WindowChrome title="app / dashboard" />
        <div className="grid grid-cols-12 gap-4 overflow-hidden rounded-b-xl bg-[#111827] p-4 sm:p-5">
          <aside className="col-span-3 hidden space-y-4 border-r border-white/5 pr-3 md:block">
            <div className="flex items-center gap-2 px-1">
              <BrandMark size={24} className="size-6 rounded-none" />
              <span className="truncate text-xs font-semibold">Sua empresa</span>
            </div>
            <ul className="space-y-1 text-xs">
              {[
                { icon: Activity, label: "Dashboard", active: true },
                { icon: Users, label: "CRM" },
                { icon: ShoppingCart, label: "Vendas" },
                { icon: Warehouse, label: "Estoque" },
                { icon: CreditCard, label: "Financeiro" },
              ].map((item) => (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                    item.active ? "bg-[#3B82F6]/20 text-[#60A5FA]" : "text-slate-400"
                  }`}
                >
                  <item.icon className="size-3.5" aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          </aside>
          <div className="col-span-12 space-y-4 md:col-span-9">
            <div>
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="text-[11px] text-slate-400">KPIs do período — dados de exemplo</p>
            </div>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { label: "Faturamento", value: "R$ 24.580" },
                { label: "Vendas", value: "147" },
                { label: "A receber", value: "R$ 8.420" },
                { label: "Estoque baixo", value: "12" },
              ].map((stat) => (
                <div key={stat.label} className="landing-card rounded-xl p-3">
                  <p className="text-[10px] tracking-wider text-slate-400 uppercase">{stat.label}</p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="landing-card relative flex h-28 items-end gap-1.5 overflow-hidden rounded-xl p-3">
              <p className="absolute top-3 left-3 text-[11px] text-slate-300">Vendas no período</p>
              {[40, 55, 48, 72, 60, 88, 70].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm bg-[#3B82F6]/50"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Product() {
  return (
    <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="landing-glass mb-8 overflow-hidden rounded-3xl p-6 md:p-10">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-3xl font-bold sm:text-4xl">Visão clara do que está acontecendo</h2>
          <p className="text-slate-300">Dashboard com KPIs de vendas, financeiro, estoque e compras.</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#0B0F19]">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <p className="font-semibold">Dashboard</p>
            <BarChart3 className="size-4 text-[#60A5FA]" aria-hidden />
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Faturamento", value: "R$ 24.580,00" },
              { label: "Vendas", value: "147" },
              { label: "Contas a receber", value: "R$ 8.420,00" },
              { label: "Itens em estoque", value: "342" },
            ].map((kpi) => (
              <div key={kpi.label} className="landing-card rounded-xl border-t-2 border-t-[#60A5FA] p-4">
                <p className="text-xs text-slate-400">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <article className="landing-glass rounded-3xl p-6 md:p-8">
          <h3 className="mb-1 text-2xl font-bold">Conheça melhor seus clientes.</h3>
          <p className="mb-6 text-sm text-slate-300">Ficha com histórico, financeiro e atividades.</p>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0F19]">
            <div className="flex items-center gap-3 border-b border-white/5 p-4">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#1E3A8A] font-bold">C</div>
              <div>
                <p className="font-semibold">Cliente exemplo</p>
                <p className="text-xs text-slate-400">Histórico comercial e financeiro</p>
              </div>
            </div>
            <div className="flex gap-2 p-3">
              {["Histórico", "Financeiro", "Atividades"].map((tab, index) => (
                <span
                  key={tab}
                  className={`rounded-full px-3 py-1 text-xs ${
                    index === 0 ? "bg-[#3B82F6] text-white" : "border border-white/10 text-slate-400"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <ul className="space-y-2 p-4 text-sm">
              <li className="flex justify-between">
                <span>Venda concluída</span>
                <span>R$ 1.200,00</span>
              </li>
              <li className="flex justify-between text-emerald-400">
                <span>Pagamento recebido</span>
                <span>R$ 1.200,00</span>
              </li>
              <li className="flex justify-between">
                <span>Atividade registrada</span>
                <span>Concluída</span>
              </li>
            </ul>
          </div>
        </article>

        <article className="landing-glass rounded-3xl p-6 md:p-8">
          <h3 className="mb-1 text-2xl font-bold">Venda e estoque juntos.</h3>
          <p className="mb-6 text-sm text-slate-300">
            Produto, quantidade e pagamento. A venda baixa o estoque.
          </p>
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold">Nova venda</p>
              <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs text-emerald-400">À vista / parcelado</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Package className="size-8 rounded bg-white/10 p-2" aria-hidden />
                <div>
                  <p className="text-sm font-medium">Produto ou serviço</p>
                  <p className="text-xs text-slate-400">Estoque atual: 14</p>
                </div>
              </div>
              <p className="text-sm">Qtd 1 · R$ 197,00</p>
            </div>
            <div className="mt-4 flex justify-between rounded-lg border border-[#3B82F6]/20 bg-[#3B82F6]/10 p-3">
              <span className="text-sm">Total</span>
              <span className="font-bold text-[#60A5FA]">R$ 197,00</span>
            </div>
          </div>
        </article>

        <article className="landing-glass rounded-3xl p-6 md:p-8">
          <h3 className="mb-1 text-2xl font-bold">Saiba o que entra e o que sai.</h3>
          <p className="mb-6 text-sm text-slate-300">
            Produto, quantidade, estoque mínimo e histórico de movimentações.
          </p>
          <div className="overflow-hidden rounded-xl border border-white/5 bg-[#0B0F19]">
            <div className="grid grid-cols-3 border-b border-white/5 px-3 py-2 text-[10px] tracking-wider text-slate-400 uppercase">
              <span>Produto</span>
              <span>Qtd / mín.</span>
              <span>Situação</span>
            </div>
            <ul className="divide-y divide-white/5 text-sm">
              <li className="grid grid-cols-3 px-3 py-3">
                <span>Produto A</span>
                <span>42 / 10</span>
                <span>Normal</span>
              </li>
              <li className="grid grid-cols-3 px-3 py-3">
                <span>Produto B</span>
                <span>8 / 10</span>
                <span className="text-amber-400">Estoque baixo</span>
              </li>
              <li className="grid grid-cols-3 px-3 py-3">
                <span>Produto C</span>
                <span>0 / 5</span>
                <span className="text-red-400">Sem estoque</span>
              </li>
            </ul>
          </div>
        </article>

        <article className="landing-glass rounded-3xl p-6 md:p-8">
          <h3 className="mb-1 text-2xl font-bold">Controle o dinheiro que entra.</h3>
          <p className="mb-6 text-sm text-slate-300">Parcelas, saldo, pagamentos parciais e vencimentos.</p>
          <div className="overflow-hidden rounded-xl border border-white/5">
            <div className="grid grid-cols-3 border-b border-white/5 bg-[#0B0F19] text-center">
              <div className="border-r border-white/5 p-3">
                <p className="text-[10px] text-slate-400">A RECEBER</p>
                <p className="font-semibold text-[#60A5FA]">R$ 4.200</p>
              </div>
              <div className="border-r border-white/5 p-3">
                <p className="text-[10px] text-slate-400">RECEBIDO</p>
                <p className="font-semibold text-emerald-400">R$ 18.100</p>
              </div>
              <div className="p-3">
                <p className="text-[10px] text-slate-400">VENCIDO</p>
                <p className="font-semibold text-red-400">R$ 350</p>
              </div>
            </div>
            <ul className="space-y-2 bg-[#0B0F19] p-4 text-sm">
              <li className="flex justify-between rounded-lg border border-white/5 p-3">
                <span>Parcela 1/3</span>
                <span className="text-emerald-400">Paga</span>
              </li>
              <li className="flex justify-between rounded-lg border border-white/5 p-3">
                <span>Parcela 2/3</span>
                <span className="text-yellow-400">Parcial</span>
              </li>
              <li className="flex justify-between rounded-lg border border-white/5 p-3">
                <span>Parcela 3/3</span>
                <span>A vencer</span>
              </li>
            </ul>
          </div>
        </article>

        <article className="landing-glass rounded-3xl p-6 md:p-8">
          <h3 className="mb-1 text-2xl font-bold">Dados para decisões.</h3>
          <p className="mb-6 text-sm text-slate-300">Indicadores e tabelas de vendas, financeiro, estoque e compras.</p>
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5">
            <p className="mb-3 text-xs text-slate-400">Relatório · exportação CSV</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Vendas do período</span>
                <span>147</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span>Recebido</span>
                <span>R$ 18.100</span>
              </div>
              <div className="flex justify-between">
                <span>Compras recebidas</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export const LandingMockups = { Hero, Product };
