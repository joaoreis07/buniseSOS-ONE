"use client";

import { useMemo, useState } from "react";
import { DEMO_REPORT_ROWS } from "@/modules/marketing/demo-data";
import {
  DataTableShell,
  FilterBar,
  ModulePageHeader,
  PageContainer,
} from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function DemoReportsScreen() {
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
      <ModulePageHeader
        title="Relatórios"
        subtitle="Vendas, financeiro, estoque e compras · dados fictícios"
      />
      <FilterBar className="mb-4 rounded-xl">
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
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Indicador</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Período</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.indicator}>
                <TableCell className="font-medium">{row.indicator}</TableCell>
                <TableCell>{row.period}</TableCell>
                <TableCell className="font-semibold">{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>

      <p className="mt-3 text-xs text-slate-500">
        No produto real os relatórios exportam CSV. Aqui o filtro só troca o rótulo do período.
      </p>

    </PageContainer>
  );
}
