type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export class RateLimitError extends Error {
  constructor(message = "Muitas tentativas. Aguarde alguns minutos e tente novamente.") {
    super(message);
    this.name = "RateLimitError";
  }
}

export function assertRateLimit(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const current = buckets.get(params.key);
  if (!current || current.resetAt <= now) {
    buckets.set(params.key, { count: 1, resetAt: now + params.windowMs });
    pruneBuckets(now);
    return;
  }
  if (current.count >= params.limit) {
    throw new RateLimitError();
  }
  current.count += 1;
}

function pruneBuckets(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function resetRateLimitForTests() {
  buckets.clear();
}
