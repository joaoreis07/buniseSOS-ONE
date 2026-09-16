import { NextResponse } from "next/server";
import {
  BillingAuthError,
  BillingConfigError,
  BillingPayloadError,
  ingestAsaasWebhook,
} from "@/modules/billing/services/webhook.service";
import { assertRateLimit, RateLimitError } from "@/shared/security/rate-limit";

export const runtime = "nodejs";

function clientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "asaas-webhook"
  );
}

export async function POST(request: Request) {
  try {
    assertRateLimit({
      key: `asaas-webhook:${clientKey(request)}`,
      limit: 60,
      windowMs: 60_000,
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    throw error;
  }

  const token = request.headers.get("asaas-access-token");
  const rawBody = await request.text();

  try {
    const result = await ingestAsaasWebhook({ rawBody, token });
    return NextResponse.json(
      { received: true, duplicate: result.duplicate },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof BillingAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof BillingConfigError) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }
    if (error instanceof BillingPayloadError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
