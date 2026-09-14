import { fromCents, toCents } from "@/modules/finance/lib/money";

export type ChangeResult = {
  current: number;
  previous: number;
  label: string;
  direction: "up" | "down" | "flat";
};

export function moneyChange(current: unknown, previous: unknown): ChangeResult {
  return numericChange(fromCents(toCents(current)), fromCents(toCents(previous)));
}

export function numericChange(current: number, previous: number): ChangeResult {
  if (previous === 0 && current === 0) {
    return { current, previous, label: "—", direction: "flat" };
  }
  if (previous === 0) {
    return { current, previous, label: "Novo", direction: "up" };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const direction = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";
  const sign = rounded > 0 ? "+" : "";
  return {
    current,
    previous,
    label: `${sign}${rounded.toLocaleString("pt-BR")}%`,
    direction,
  };
}
