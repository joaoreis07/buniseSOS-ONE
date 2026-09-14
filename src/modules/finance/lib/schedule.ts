import type { InstallmentPeriod } from "@prisma/client";

export function parseCivilDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("Data de vencimento inválida");
  const date = new Date(`${value}T12:00:00.000`);
  if (Number.isNaN(date.getTime())) throw new Error("Data de vencimento inválida");
  return date;
}

export function defaultDueDate(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

export function buildDueDates(params: { firstDueDate: Date; count: number; period: InstallmentPeriod }): Date[] {
  return Array.from({ length: params.count }, (_, index) => {
    const due = new Date(params.firstDueDate);
    if (params.period === "WEEKLY") due.setDate(due.getDate() + index * 7);
    if (params.period === "BIWEEKLY") due.setDate(due.getDate() + index * 14);
    if (params.period === "MONTHLY") due.setMonth(due.getMonth() + index);
    return due;
  });
}

export function isOverdue(dueDate: Date, now = new Date()): boolean {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return due < today;
}
