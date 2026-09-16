import {
  BillingConfigError,
  BillingError,
} from "@/modules/billing/lib/errors";
import {
  getAsaasApiKey,
  resolveAsaasBaseUrl,
} from "@/modules/billing/lib/env";
import { decimalToAsaasValue } from "@/modules/billing/lib/money";
import type {
  BillingCustomer,
  BillingCustomerInput,
  BillingPaymentRecord,
  BillingProvider,
  BillingSubscriptionRecord,
  CreateBillingSubscriptionInput,
} from "@/modules/billing/providers/billing-provider";

type AsaasErrorBody = {
  errors?: Array<{ code?: string; description?: string }>;
};

function digits(value: string | null | undefined) {
  return value?.replace(/\D+/g, "") || undefined;
}

function mapCustomer(raw: Record<string, unknown>): BillingCustomer {
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    email: raw.email ? String(raw.email) : null,
    cpfCnpj: raw.cpfCnpj ? String(raw.cpfCnpj) : null,
    externalReference: raw.externalReference ? String(raw.externalReference) : null,
  };
}

function mapSubscription(raw: Record<string, unknown>): BillingSubscriptionRecord {
  return {
    id: String(raw.id ?? ""),
    customerId: String(raw.customer ?? ""),
    status: String(raw.status ?? ""),
    value: String(raw.value ?? "0"),
    nextDueDate: raw.nextDueDate ? String(raw.nextDueDate) : null,
    cycle: String(raw.cycle ?? ""),
    billingType: String(raw.billingType ?? ""),
    description: raw.description ? String(raw.description) : null,
    deleted: Boolean(raw.deleted),
    invoiceUrl: null,
  };
}

function mapPayment(raw: Record<string, unknown>): BillingPaymentRecord {
  return {
    id: String(raw.id ?? ""),
    subscriptionId: raw.subscription ? String(raw.subscription) : null,
    customerId: String(raw.customer ?? ""),
    status: String(raw.status ?? ""),
    value: String(raw.value ?? "0"),
    dueDate: raw.dueDate ? String(raw.dueDate) : null,
    paymentDate: raw.paymentDate ? String(raw.paymentDate) : raw.clientPaymentDate
      ? String(raw.clientPaymentDate)
      : null,
    invoiceUrl: raw.invoiceUrl ? String(raw.invoiceUrl) : null,
  };
}

function publicAsaasError(body: AsaasErrorBody | null, fallback: string) {
  const description = body?.errors?.[0]?.description?.trim();
  if (description && description.length < 160 && !/access_token|api key|token/i.test(description)) {
    return description;
  }
  return fallback;
}

export class AsaasBillingProvider implements BillingProvider {
  readonly name = "asaas" as const;

  private async request<T>(
    path: string,
    init: RequestInit & { idempotencyKey?: string } = {},
  ): Promise<T> {
    const apiKey = getAsaasApiKey();
    const baseUrl = resolveAsaasBaseUrl();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "BusinessOS-One",
      access_token: apiKey,
    };
    if (init.idempotencyKey) {
      headers["Idempotency-Key"] = init.idempotencyKey;
    }

    const response = await fetch(`${baseUrl}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body,
    });

    const text = await response.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = null;
      }
    }

    if (!response.ok) {
      const message = publicAsaasError(
        parsed as AsaasErrorBody | null,
        `Falha na cobrança (${response.status})`,
      );
      throw new BillingError(message);
    }

    return parsed as T;
  }

  async ensureCustomer(input: BillingCustomerInput): Promise<BillingCustomer> {
    const existing = await this.findCustomerByExternalReference(input.externalReference);
    if (existing) return existing;

    const created = await this.request<Record<string, unknown>>("/customers", {
      method: "POST",
      idempotencyKey: `customer:${input.externalReference}`,
      body: JSON.stringify({
        name: input.name,
        email: input.email || undefined,
        cpfCnpj: digits(input.cpfCnpj),
        phone: digits(input.phone),
        mobilePhone: digits(input.mobilePhone),
        postalCode: digits(input.postalCode),
        address: input.address || undefined,
        addressNumber: input.addressNumber || undefined,
        complement: input.complement || undefined,
        province: input.province || undefined,
        externalReference: input.externalReference,
        notificationDisabled: true,
      }),
    });
    return mapCustomer(created);
  }

  async findCustomerByExternalReference(
    externalReference: string,
  ): Promise<BillingCustomer | null> {
    const result = await this.request<{ data?: Record<string, unknown>[] }>(
      `/customers?externalReference=${encodeURIComponent(externalReference)}&limit=1`,
    );
    const first = result.data?.[0];
    return first ? mapCustomer(first) : null;
  }

  async getCustomer(id: string): Promise<BillingCustomer | null> {
    try {
      const raw = await this.request<Record<string, unknown>>(`/customers/${encodeURIComponent(id)}`);
      return mapCustomer(raw);
    } catch {
      return null;
    }
  }

  async createSubscription(
    input: CreateBillingSubscriptionInput,
  ): Promise<BillingSubscriptionRecord> {
    const value = decimalToAsaasValue(input.value);
    const created = await this.request<Record<string, unknown>>("/subscriptions", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: JSON.stringify({
        customer: input.customerId,
        billingType: "UNDEFINED",
        value,
        nextDueDate: input.nextDueDate,
        cycle: input.cycle,
        description: input.description,
        externalReference: input.externalReference,
      }),
    });
    const mapped = mapSubscription(created);
    const payments = await this.listPaymentsBySubscription(mapped.id);
    mapped.invoiceUrl = payments[0]?.invoiceUrl ?? null;
    return mapped;
  }

  async getSubscription(id: string): Promise<BillingSubscriptionRecord | null> {
    try {
      const raw = await this.request<Record<string, unknown>>(
        `/subscriptions/${encodeURIComponent(id)}`,
      );
      const mapped = mapSubscription(raw);
      const payments = await this.listPaymentsBySubscription(mapped.id);
      mapped.invoiceUrl = payments.find((item) => item.invoiceUrl)?.invoiceUrl ?? null;
      return mapped;
    } catch {
      return null;
    }
  }

  async cancelSubscription(id: string): Promise<BillingSubscriptionRecord> {
    const raw = await this.request<Record<string, unknown>>(
      `/subscriptions/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
    return mapSubscription(raw);
  }

  async listPaymentsBySubscription(id: string): Promise<BillingPaymentRecord[]> {
    const result = await this.request<{ data?: Record<string, unknown>[] }>(
      `/payments?subscription=${encodeURIComponent(id)}&limit=20`,
    );
    return (result.data ?? []).map(mapPayment);
  }

  async getPayment(id: string): Promise<BillingPaymentRecord | null> {
    try {
      const raw = await this.request<Record<string, unknown>>(
        `/payments/${encodeURIComponent(id)}`,
      );
      return mapPayment(raw);
    } catch {
      return null;
    }
  }
}

export function requireAsaasProviderConfig() {
  try {
    getAsaasApiKey();
  } catch {
    throw new BillingConfigError();
  }
}
