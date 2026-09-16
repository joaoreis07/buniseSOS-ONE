export type BillingCustomerInput = {
  name: string;
  email?: string | null;
  cpfCnpj?: string | null;
  phone?: string | null;
  mobilePhone?: string | null;
  postalCode?: string | null;
  address?: string | null;
  addressNumber?: string | null;
  complement?: string | null;
  province?: string | null;
  externalReference: string;
};

export type BillingCustomer = {
  id: string;
  name: string;
  email: string | null;
  cpfCnpj: string | null;
  externalReference: string | null;
};

export type CreateBillingSubscriptionInput = {
  customerId: string;
  value: string;
  nextDueDate: string;
  cycle: "MONTHLY" | "YEARLY";
  description: string;
  externalReference: string;
  idempotencyKey: string;
};

export type BillingSubscriptionRecord = {
  id: string;
  customerId: string;
  status: string;
  value: string;
  nextDueDate: string | null;
  cycle: string;
  billingType: string;
  description: string | null;
  deleted: boolean;
  invoiceUrl: string | null;
};

export type BillingPaymentRecord = {
  id: string;
  subscriptionId: string | null;
  customerId: string;
  status: string;
  value: string;
  dueDate: string | null;
  paymentDate: string | null;
  invoiceUrl: string | null;
};

export interface BillingProvider {
  readonly name: "asaas" | "fake";
  ensureCustomer(input: BillingCustomerInput): Promise<BillingCustomer>;
  findCustomerByExternalReference(
    externalReference: string,
  ): Promise<BillingCustomer | null>;
  getCustomer(id: string): Promise<BillingCustomer | null>;
  createSubscription(
    input: CreateBillingSubscriptionInput,
  ): Promise<BillingSubscriptionRecord>;
  getSubscription(id: string): Promise<BillingSubscriptionRecord | null>;
  cancelSubscription(id: string): Promise<BillingSubscriptionRecord>;
  listPaymentsBySubscription(id: string): Promise<BillingPaymentRecord[]>;
  getPayment(id: string): Promise<BillingPaymentRecord | null>;
}
