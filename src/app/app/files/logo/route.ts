import { NextResponse } from "next/server";
import { requireSession } from "@/shared/auth/session";
import { readCompanyLogoForSession } from "@/modules/settings/services/settings.service";

export async function GET() {
  const user = await requireSession();
  const logo = await readCompanyLogoForSession(user.companyId);
  if (!logo) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(Uint8Array.from(logo.buffer), {
    headers: {
      "Content-Type": logo.kind === "png" ? "image/png" : "image/jpeg",
      "Cache-Control": "private, max-age=60",
    },
  });
}
