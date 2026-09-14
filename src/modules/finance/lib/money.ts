/** Financial calculations always use integer cents in memory. */
export function toCents(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) throw new Error("Valor monetário inválido");
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  if (!Number.isSafeInteger(cents)) throw new Error("Valor monetário inválido");
  return cents / 100;
}

export function splitCents(totalCents: number, count: number): number[] {
  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    throw new Error("Total inválido para parcelamento");
  }
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Quantidade de parcelas inválida");
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return Array.from(
    { length: count },
    (_, index) => base + (index >= count - remainder ? 1 : 0),
  );
}
