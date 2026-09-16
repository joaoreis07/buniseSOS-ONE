import { randomBytes } from "crypto";
import type {
  BillingCustomer,
  BillingCustomerInput,
  BillingPaymentRecord,
  BillingProvider,
  BillingSubscriptionRecord,
  CreateBillingSubscriptionInput,
} from "@/modules/billing/providers/billing-provider";

type FakeState = {
  customersByRef: Map<string, BillingCustomer>;
  customersById: Map<string, BillingCustomer>;
  subscriptions: Map<string, BillingSubscriptionRecord>;
  payments: Map<string, BillingPaymentRecord>;
  failNextCustomer: boolean;
  failNextSubscription: boolean;
};

const state: FakeState = createState();

function createState(): FakeState {
  return {
    customersByRef: new Map(),
    customersById: new Map(),
    subscriptions: new Map(),
    payments: new Map(),
    failNextCustomer: false,
    failNextSubscription: false,
  };
}

function nextId(prefix: string) {
  return `${prefix}_${randomBytes(6).toString("hex")}`;
}

function toCustomer(input: BillingCustomerInput, id?: string): BillingCustomer {
  return {
    id: id ?? nextId("cus"),
    name: input.name,
    email: input.email ?? null,
    cpfCnpj: input.cpfCnpj ?? null,
    externalReference: input.externalReference,
  };
}

export function resetFakeBillingProvider() {
  const next = createState();
  state.customersByRef = next.customersByRef;
  state.customersById = next.customersById;
  state.subscriptions = next.subscriptions;
  state.payments = next.payments;
  state.failNextCustomer = false;
  state.failNextSubscription = false;
}

export function setFakeBillingFailure(kind: "customer" | "subscription", value = true) {
  if (kind === "customer") state.failNextCustomer = value;
  if (kind === "subscription") state.failNextSubscription = value;
}

export class FakeBillingProvider implements BillingProvider {
  readonly name = "fake" as const;

  async ensureCustomer(input: BillingCustomerInput): Promise<BillingCustomer> {
    if (state.failNextCustomer) {
      state.failNextCustomer = false;
      throw new Error("Falha simulada ao criar customer");
    }
    const existing = state.customersByRef.get(input.externalReference);
    if (existing) return existing;
    const created = toCustomer(input);
    state.customersByRef.set(input.externalReference, created);
    state.customersById.set(created.id, created);
    return created;
  }

  async findCustomerByExternalReference(
    externalReference: string,
  ): Promise<BillingCustomer | null> {
    return state.customersByRef.get(externalReference) ?? null;
  }

  async getCustomer(id: string): Promise<BillingCustomer | null> {
    return state.customersById.get(id) ?? null;
  }

  async createSubscription(
    input: CreateBillingSubscriptionInput,
  ): Promise<BillingSubscriptionRecord> {
    if (state.failNextSubscription) {
      state.failNextSubscription = false;
      throw new Error("Falha simulada ao criar assinatura");
    }
    const existing = [...state.subscriptions.values()].find(
      (item) =>
        item.customerId === input.customerId &&
        !item.deleted &&
        item.status !== "INACTIVE" &&
        item.status !== "EXPIRED",
    );
    if (existing) return existing;

    const id = nextId("sub");
    const subscription: BillingSubscriptionRecord = {
      id,
      customerId: input.customerId,
      status: "ACTIVE",
      value: input.value,
      nextDueDate: input.nextDueDate,
      cycle: input.cycle,
      billingType: "UNDEFINED",
      description: input.description,
      deleted: false,
      invoiceUrl: `https://sandbox.asaas.com/c/${id}`,
    };
    state.subscriptions.set(id, subscription);

    const payment: BillingPaymentRecord = {
      id: nextId("pay"),
      subscriptionId: id,
      customerId: input.customerId,
      status: "PENDING",
      value: input.value,
      dueDate: input.nextDueDate,
      paymentDate: null,
      invoiceUrl: subscription.invoiceUrl,
    };
    state.payments.set(payment.id, payment);
    return subscription;
  }

  async getSubscription(id: string): Promise<BillingSubscriptionRecord | null> {
    return state.subscriptions.get(id) ?? null;
  }

  async cancelSubscription(id: string): Promise<BillingSubscriptionRecord> {
    const current = state.subscriptions.get(id);
    if (!current) {
      throw new Error("Assinatura não encontrada no provedor");
    }
    const cancelled: BillingSubscriptionRecord = {
      ...current,
      status: "INACTIVE",
      deleted: true,
    };
    state.subscriptions.set(id, cancelled);
    return cancelled;
  }

  async listPaymentsBySubscription(id: string): Promise<BillingPaymentRecord[]> {
    return [...state.payments.values()].filter((item) => item.subscriptionId === id);
  }

  async getPayment(id: string): Promise<BillingPaymentRecord | null> {
    return state.payments.get(id) ?? null;
  }
}
