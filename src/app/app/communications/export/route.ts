import { NextResponse } from "next/server";
import { getValidatedSessionUser } from "@/shared/auth/session";
import { communicationListQuerySchema } from "@/modules/communications/schemas/communication.schemas";
import { exportCommunicationsCsv } from "@/modules/communications/services/communication.service";

export async function GET(request: Request) {
  const user = await getValidatedSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(request.url);
  const raw: Record<string, string | undefined> = {};
  url.searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  try {
    const query = communicationListQuerySchema.parse({
      ...raw,
      page: 1,
      pageSize: 50,
    });
    const exported = await exportCommunicationsCsv({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      query,
    });
    return new NextResponse(exported.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exported.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Não foi possível exportar.";
    const status = message.includes("permissão") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
