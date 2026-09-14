import { NextResponse } from "next/server";
import { getValidatedSessionUser } from "@/shared/auth/session";
import { firstSearchParam } from "@/modules/reports/lib/params";
import {
  financeReportQuerySchema,
  inventoryReportQuerySchema,
  purchasesReportQuerySchema,
  reportTypeSchema,
  salesReportQuerySchema,
} from "@/modules/reports/schemas/reports.schemas";
import { exportReportCsv } from "@/modules/reports/services/reports.service";

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

  const typeParsed = reportTypeSchema.safeParse(firstSearchParam(raw, "type"));
  if (!typeParsed.success) {
    return NextResponse.json({ error: "Relatório inválido" }, { status: 400 });
  }
  const type = typeParsed.data;

  try {
    const query =
      type === "sales"
        ? salesReportQuerySchema.parse({
            preset: raw.preset ?? "last_30",
            from: raw.from,
            to: raw.to,
            productId: raw.productId,
            customerId: raw.customerId,
            sellerId: raw.sellerId,
            status: raw.status,
            paymentMethod: raw.paymentMethod,
            page: 1,
          })
        : type === "finance"
          ? financeReportQuerySchema.parse({
              preset: raw.preset ?? "last_30",
              from: raw.from,
              to: raw.to,
              status: raw.status,
              customerId: raw.customerId,
              paymentMethod: raw.paymentMethod,
              page: 1,
            })
          : type === "inventory"
            ? inventoryReportQuerySchema.parse({
                q: raw.q,
                stock: raw.stock,
                page: 1,
              })
            : purchasesReportQuerySchema.parse({
                preset: raw.preset ?? "last_30",
                from: raw.from,
                to: raw.to,
                supplierId: raw.supplierId,
                productId: raw.productId,
                status: raw.status,
                page: 1,
              });

    const exported = await exportReportCsv({
      companyId: user.companyId,
      userId: user.id,
      role: user.role,
      type,
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
      error instanceof Error ? error.message : "Não foi possível exportar o relatório.";
    const status = message.includes("permissão") ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
