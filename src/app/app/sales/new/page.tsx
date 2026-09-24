import Link from "next/link";
import { requirePermission } from "@/shared/auth/session";
import { getSaleFormMeta } from "@/modules/sales/services/sale.service";
import { getOperationalDefaults } from "@/modules/settings/services/settings.service";
import { NewSaleForm } from "@/modules/sales/components/new-sale-form";
import { Button } from "@/shared/ui/button";
import { ModulePageHeader, PageContainer } from "@/shared/components/page-layout";

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("sales:create");
  const raw = await searchParams;
  const customerId =
    typeof raw.customerId === "string" ? raw.customerId : undefined;
  const meta = await getSaleFormMeta(user.companyId);
  const defaults = await getOperationalDefaults(user.companyId);

  return (
    <PageContainer>
      <ModulePageHeader
        title="Nova venda"
        subtitle="Totais e estoque são validados no servidor"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/app/sales">Voltar</Link>
          </Button>
        }
      />
      <NewSaleForm
        products={meta.products}
        customers={meta.customers}
        defaultCustomerId={customerId}
        defaultNotes={defaults.defaultSaleNotes}
        defaultInstallmentCount={defaults.defaultInstallmentCount}
        allowSaleWithoutCustomer={defaults.allowSaleWithoutCustomer}
      />
    </PageContainer>
  );
}
