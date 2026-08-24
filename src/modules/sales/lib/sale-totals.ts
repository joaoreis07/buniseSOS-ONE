export class SaleTotalsError extends Error {
  readonly path: string;

  constructor(message: string, path = "total") {
    super(message);
    this.name = "SaleTotalsError";
    this.path = path;
  }
}

export type SaleLineInput = {
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
};

export type ComputedSaleLine = {
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  lineTotal: number;
};

export type ComputedSaleTotals = {
  items: ComputedSaleLine[];
  subtotal: number;
  discountAmount: number;
  total: number;
};

function toCents(value: number): number {
  return Math.round(value * 100);
}

function fromCents(cents: number): number {
  return cents / 100;
}

export function computeSaleTotals(
  items: SaleLineInput[],
  generalDiscountAmount = 0,
): ComputedSaleTotals {
  if (items.length === 0) {
    throw new SaleTotalsError("Informe ao menos um item", "items");
  }

  const computedItems: ComputedSaleLine[] = items.map((item, index) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new SaleTotalsError(
        "Quantidade deve ser um inteiro maior que zero",
        `items.${index}.quantity`,
      );
    }
    if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
      throw new SaleTotalsError("Preço unitário inválido", `items.${index}.unitPrice`);
    }

    const unitPriceCents = toCents(item.unitPrice);
    const subtotalCents = item.quantity * unitPriceCents;
    const discountRaw = item.discountAmount ?? 0;
    if (!Number.isFinite(discountRaw) || discountRaw < 0) {
      throw new SaleTotalsError(
        "Desconto do item inválido",
        `items.${index}.discountAmount`,
      );
    }
    const discountCents = toCents(discountRaw);
    if (discountCents > subtotalCents) {
      throw new SaleTotalsError(
        "Desconto do item maior que o subtotal",
        `items.${index}.discountAmount`,
      );
    }

    const lineTotalCents = subtotalCents - discountCents;
    if (lineTotalCents < 0) {
      throw new SaleTotalsError("Total do item inválido", `items.${index}`);
    }

    return {
      quantity: item.quantity,
      unitPrice: fromCents(unitPriceCents),
      discountAmount: fromCents(discountCents),
      lineTotal: fromCents(lineTotalCents),
    };
  });

  const subtotalCents = computedItems.reduce(
    (acc, item) => acc + toCents(item.lineTotal),
    0,
  );
  if (!Number.isFinite(generalDiscountAmount) || generalDiscountAmount < 0) {
    throw new SaleTotalsError("Desconto geral inválido", "discountAmount");
  }
  const generalCents = toCents(generalDiscountAmount);
  if (generalCents > subtotalCents) {
    throw new SaleTotalsError(
      "Desconto geral maior que o subtotal",
      "discountAmount",
    );
  }

  const totalCents = subtotalCents - generalCents;
  if (totalCents < 0) {
    throw new SaleTotalsError("Total inválido", "total");
  }

  return {
    items: computedItems,
    subtotal: fromCents(subtotalCents),
    discountAmount: fromCents(generalCents),
    total: fromCents(totalCents),
  };
}

export function formatSaleNumber(number: number): string {
  return `V-${String(number).padStart(5, "0")}`;
}
