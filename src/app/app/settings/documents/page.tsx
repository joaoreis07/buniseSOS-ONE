import { requirePermission } from "@/shared/auth/session";
import { hasPermission } from "@/shared/permissions/rbac";
import { getCompanyProfileForTenant } from "@/modules/settings/services/settings.service";
import { DocumentSettingsForm } from "@/modules/settings/components/document-settings-form";
import { SettingsSubnav } from "@/modules/team/components/settings-subnav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { PageContainer, PageHeader } from "@/shared/components/page-layout";

export default async function SettingsDocumentsPage() {
  const user = await requirePermission("settings:view");
  const profile = await getCompanyProfileForTenant({
    companyId: user.companyId,
    role: user.role,
  });
  const settings = profile.settings;
  const canManage = hasPermission(user.role, "settings:manage");

  return (
    <PageContainer>
      <SettingsSubnav role={user.role} active="documents" />

      <PageHeader
        eyebrow="Configurações"
        title="Documentos"
        description="Textos padrão, assinatura e regras operacionais da empresa."
      />

      <Card>
        <CardHeader>
          <CardTitle>Personalização simples</CardTitle>
          <CardDescription>
            Sem editor visual. Estes textos aparecem em recibos, comprovantes e
            comunicações quando configurados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentSettingsForm
            canManage={canManage}
            documentTitle={settings.documentTitle}
            documentHeader={settings.documentHeader}
            documentFooter={settings.documentFooter}
            communicationSignature={settings.communicationSignature}
            defaultSaleNotes={settings.defaultSaleNotes}
            defaultPurchaseNotes={settings.defaultPurchaseNotes}
            defaultReceiptNotes={settings.defaultReceiptNotes}
            allowSaleWithoutCustomer={settings.allowSaleWithoutCustomer}
            defaultInstallmentCount={settings.defaultInstallmentCount}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
