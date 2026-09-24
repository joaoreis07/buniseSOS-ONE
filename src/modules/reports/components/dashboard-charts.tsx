"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatMoneyBRL } from "@/modules/sales/lib/sale-labels";

const COLORS = ["#0055E5", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

function fmtAxis(v: number) {
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label ? <p className="mb-1 font-medium text-slate-700">{label}</p> : null}
      {payload.map((entry) => (
        <p key={entry.name} className="text-slate-600">
          {entry.name}: {formatMoneyBRL(entry.value ?? 0)}
        </p>
      ))}
    </div>
  );
}

export function RevenueExpenseChart({
  data,
}: {
  data: Array<{ month: string; receita: number; despesa: number }>;
}) {
  if (data.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-slate-400">
        Sem dados de receita e despesa no período.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0055E5" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0055E5" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.12} />
            <stop offset="95%" stopColor="#94A3B8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={fmtAxis}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="receita"
          name="Receita"
          stroke="#0055E5"
          strokeWidth={2}
          fill="url(#colorReceita)"
        />
        <Area
          type="monotone"
          dataKey="despesa"
          name="Despesa"
          stroke="#94A3B8"
          strokeWidth={1.5}
          fill="url(#colorDespesa)"
          strokeDasharray="4 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryPieChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        Sem vendas por categoria no período.
      </p>
    );
  }

  return (
    <>
      <ResponsiveContainer width="100%" height={130}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={60}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => formatMoneyBRL(Number(v))}
            contentStyle={{
              fontSize: 11,
              border: "1px solid #E2E8F0",
              borderRadius: 8,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-3 space-y-2">
        {data.map((item, i) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex min-w-0 items-center gap-1.5">
              <div
                className="size-2 shrink-0 rounded-sm"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="max-w-28 truncate text-slate-500">{item.name}</span>
            </div>
            <span className="shrink-0 font-semibold text-slate-700">
              {formatMoneyBRL(item.value)}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export function SalesBarChart({
  data,
  subtitle,
}: {
  data: Array<{ label: string; value: number }>;
  subtitle?: string;
}) {
  if (data.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-400">
        Sem vendas no período selecionado.
      </p>
    );
  }

  const chartData = data.map((row) => ({ d: row.label, v: row.value }));

  return (
    <>
      {subtitle ? <p className="mb-4 text-xs text-slate-400">{subtitle}</p> : null}
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="d"
            tick={{ fontSize: 10, fill: "#CBD5E1" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#CBD5E1" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={fmtAxis}
          />
          <Tooltip
            formatter={(v) => [formatMoneyBRL(Number(v)), "Vendas"]}
            contentStyle={{
              fontSize: 11,
              border: "1px solid #E2E8F0",
              borderRadius: 8,
            }}
          />
          <Bar dataKey="v" fill="#0055E5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </>
  );
}

export function CrmFunnelChart({
  data,
}: {
  data: Array<{ stage: string; count: number }>;
}) {
  if (data.every((row) => row.count === 0)) {
    return (
      <p className="py-16 text-center text-sm text-slate-400">
        Sem oportunidades no funil.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 60, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="stage"
          type="category"
          tick={{ fontSize: 11, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          width={80}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: "1px solid #E2E8F0",
            borderRadius: 8,
          }}
        />
        <Bar dataKey="count" name="Oportunidades" fill="#0055E5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
