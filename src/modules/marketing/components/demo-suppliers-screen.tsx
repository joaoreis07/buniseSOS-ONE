"use client";

import { Users } from "lucide-react";
import { DEMO_PURCHASES } from "@/modules/marketing/demo-data";
import {
  DataTableShell,
  ModulePageHeader,
  PageContainer,
  StatCard,
} from "@/shared/components/page-layout";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

export function DemoSuppliersScreen() {
  const suppliers = DEMO_PURCHASES.map((p) => p.supplier).filter(
    (name, index, arr) => arr.indexOf(name) === index,
  );

  return (
    <PageContainer>
      <ModulePageHeader
        title="Fornecedores"
        subtitle="Cadastro e gestão de fornecedores · dados fictícios"
      />
      <div className="mb-6">
        <StatCard label="Fornecedores ativos" value={suppliers.length} icon={Users} tone="blue" />
      </div>

      <DataTableShell>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Nome</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Contato</TableHead>
              <TableHead className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((name) => (
              <TableRow key={name}>
                <TableCell className="font-semibold text-[var(--bos-primary)]">{name}</TableCell>
                <TableCell>(11) 3000-0000</TableCell>
                <TableCell>
                  <Badge variant="success">Ativo</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableShell>

    </PageContainer>
  );
}
