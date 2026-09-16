import { headers } from "next/headers";

export async function clientRateKey(scope: string, extra?: string) {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headerList.get("x-real-ip")?.trim();
  const ip = forwarded || realIp || "local";
  const suffix = extra?.trim().toLowerCase() ?? "";
  return `${scope}:${ip}:${suffix}`;
}
