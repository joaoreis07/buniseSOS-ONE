import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { composeIntentSchema } from "@/modules/communications/schemas/communication.schemas";
import { canSendCommunications, getComposeContextForTenant } from "@/modules/communications/services/communication.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { ComposeWhatsAppForm } from "@/modules/communications/components/compose-whatsapp-form";
import { TEMPLATE_VARIABLES } from "@/modules/communications/lib/template-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

function first(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}

export default async function ComposeCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("communications:send");
  if (!canSendCommunications(user.role)) notFound();
  const raw = await searchParams;
  const intentParsed = composeIntentSchema.safeParse(first(raw.intent));
  const context = await getComposeContextForTenant({
    companyId: user.companyId,
    role: user.role,
    customerId: first(raw.customerId),
    saleId: first(raw.saleId),
    installmentId: first(raw.installmentId),
    activityId: first(raw.activityId),
    templateId: first(raw.templateId),
    intent: intentParsed.success ? intentParsed.data : "manual",
  });

  return (
    <div className="space-y-6">
      <CommunicationsSubnav role={user.role} active="compose" />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Preparar WhatsApp</h1>
        <p className="text-muted-foreground">
          A mensagem é preparada aqui. O envio acontece no WhatsApp, não neste sistema.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <ComposeWhatsAppForm
              customerId={context.customer?.id}
              saleId={context.sale?.id}
              installmentId={context.installment?.id}
              activityId={context.activity?.id}
              origin={context.origin}
              type={context.type}
              intent={intentParsed.success ? intentParsed.data : "manual"}
              recipient={context.recipient}
              customerName={context.customer?.name}
              templates={context.templates}
              selectedTemplateId={context.selectedTemplate?.id}
              values={context.values}
              initialBody={context.selectedTemplate?.body ?? ""}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Variáveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {TEMPLATE_VARIABLES.map((name) => (
              <p key={name}>
                <span className="text-muted-foreground">{`{{${name}}}`}</span>
                {": "}
                {context.values[name] || "—"}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
