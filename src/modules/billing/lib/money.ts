import { Prisma } from "@prisma/client";

export function decimalToAsaasValue(value: Prisma.Decimal | string | number): number {
  const amount = Number(new Prisma.Decimal(value).toFixed(2));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Preço do plano inválido");
  }
  return amount;
}

export function asaasValueToDecimal(value: unknown): Prisma.Decimal {
  return new Prisma.Decimal(String(value ?? "0")).toDecimalPlaces(2);
}
