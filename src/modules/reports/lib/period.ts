export const PERIOD_PRESETS = [
  "today",
  "yesterday",
  "last_7",
  "last_30",
  "this_month",
  "last_month",
  "custom",
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];
export type ChartGroup = "day" | "week" | "month";

export type DateRange = {
  start: Date;
  end: Date;
  preset: PeriodPreset;
  group: ChartGroup;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function endOfDay(value: Date) {
  return new Date(
    value.getFullYear(),
    value.getMonth(),
    value.getDate(),
    23,
    59,
    59,
    999,
  );
}

function parseCivilDate(value: string, end = false): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Data inválida");
  }
  const date = new Date(`${value}T12:00:00.000`);
  if (Number.isNaN(date.getTime())) throw new Error("Data inválida");
  return end ? endOfDay(date) : startOfDay(date);
}

function chooseGroup(start: Date, end: Date): ChartGroup {
  const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

export function resolvePeriod(params: {
  preset?: string | null;
  from?: string | null;
  to?: string | null;
  now?: Date;
}): DateRange {
  const now = params.now ?? new Date();
  const today = startOfDay(now);
  const preset = (PERIOD_PRESETS as readonly string[]).includes(params.preset ?? "")
    ? (params.preset as PeriodPreset)
    : "last_30";

  if (preset === "custom") {
    if (!params.from || !params.to) {
      throw new Error("Informe a data inicial e a data final");
    }
    const start = parseCivilDate(params.from);
    const end = parseCivilDate(params.to, true);
    if (start > end) throw new Error("A data inicial deve ser anterior à final");
    return { start, end, preset, group: chooseGroup(start, end) };
  }

  if (preset === "today") {
    return { start: today, end: endOfDay(today), preset, group: "day" };
  }
  if (preset === "yesterday") {
    const day = new Date(today);
    day.setDate(day.getDate() - 1);
    return { start: startOfDay(day), end: endOfDay(day), preset, group: "day" };
  }
  if (preset === "last_7") {
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    return { start, end: endOfDay(today), preset, group: "day" };
  }
  if (preset === "last_30") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { start, end: endOfDay(today), preset, group: "day" };
  }
  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start,
      end: endOfDay(today),
      preset,
      group: chooseGroup(start, endOfDay(today)),
    };
  }
  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const end = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
  return { start, end, preset: "last_month", group: chooseGroup(start, end) };
}

export function previousRange(range: DateRange): { start: Date; end: Date } {
  const duration = range.end.getTime() - range.start.getTime();
  const end = new Date(range.start.getTime() - 1);
  const start = new Date(end.getTime() - duration);
  return { start, end };
}

function startOfWeekMonday(value: Date) {
  const start = startOfDay(value);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
}

export function enumerateBuckets(
  start: Date,
  end: Date,
  group: ChartGroup,
): Date[] {
  const dates: Date[] = [];
  if (group === "day") {
    const cursor = startOfDay(start);
    const last = startOfDay(end);
    while (cursor <= last) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }
  if (group === "week") {
    const cursor = startOfWeekMonday(start);
    const last = startOfWeekMonday(end);
    while (cursor <= last) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return dates;
  }
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return dates;
}

export function formatCivilDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatChartLabel(value: Date, group: ChartGroup): string {
  if (group === "month") {
    return value.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  }
  if (group === "week") {
    return value.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return value.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

export const PERIOD_PRESET_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  yesterday: "Ontem",
  last_7: "Últimos 7 dias",
  last_30: "Últimos 30 dias",
  this_month: "Este mês",
  last_month: "Mês anterior",
  custom: "Personalizado",
};
