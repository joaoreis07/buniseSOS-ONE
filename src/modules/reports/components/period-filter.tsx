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
}: {
  action: string;
  range: DateRange;
  extra?: ReactNode;
}) {
  return (
    <form
      action={action}
      className="flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:flex-wrap lg:items-end"
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
