export class BillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingError";
  }
}

export class BillingAuthError extends BillingError {
  constructor(message = "Webhook não autorizado") {
    super(message);
    this.name = "BillingAuthError";
  }
}

export class BillingConfigError extends BillingError {
  constructor(message = "Cobrança não configurada neste ambiente") {
    super(message);
    this.name = "BillingConfigError";
  }
}

export class BillingPayloadError extends BillingError {
  constructor(message = "Payload de webhook inválido") {
    super(message);
    this.name = "BillingPayloadError";
  }
}
