import type { ReactNode } from "react";
import Link from "next/link";
import {
  PERIOD_PRESET_LABELS,
  PERIOD_PRESETS,
  formatCivilDate,
  type DateRange,
  type PeriodPreset,
} from "@/modules/reports/lib/period";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function PeriodFilter({
  action,
  range,
  extra,
  compact = false,
}: {
  action: string;
  range: DateRange;
  extra?: ReactNode;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <form action={action} className="flex flex-wrap items-end gap-2">
        <div className="min-w-40 flex-1 sm:max-w-56">
          <Label htmlFor="preset" className="sr-only">
            Período
          </Label>
          <select
            id="preset"
            name="preset"
            defaultValue={range.preset}
            className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            {PERIOD_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {PERIOD_PRESET_LABELS[preset as PeriodPreset]}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="from"
          name="from"
          type="date"
          aria-label="Data inicial"
          defaultValue={formatCivilDate(range.start)}
          className="h-9 w-[9.5rem]"
        />
        <Input
          id="to"
          name="to"
          type="date"
          aria-label="Data final"
          defaultValue={formatCivilDate(range.end)}
          className="h-9 w-[9.5rem]"
        />
        {extra}
        <Button type="submit" size="sm" className="h-9">
          Aplicar
        </Button>
        <Button asChild variant="ghost" size="sm" className="h-9">
          <Link href={action}>Limpar</Link>
        </Button>
      </form>
    );
  }

  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end"
    >
      <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="preset">Período</Label>
          <select
            id="preset"
            name="preset"
            defaultValue={range.preset}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {PERIOD_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {PERIOD_PRESET_LABELS[preset as PeriodPreset]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="from">Data inicial</Label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={formatCivilDate(range.start)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="to">Data final</Label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={formatCivilDate(range.end)}
          />
        </div>
        <p className="text-xs text-muted-foreground sm:col-span-2 lg:col-span-4">
          Para usar as datas ao lado, selecione Personalizado.
        </p>
      </div>
      {extra}
      <div className="flex gap-2">
        <Button type="submit">Aplicar</Button>
        <Button asChild variant="outline">
          <Link href={action}>Limpar</Link>
        </Button>
      </div>
    </form>
  );
}
