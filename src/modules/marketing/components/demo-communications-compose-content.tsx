"use client";

import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import { TEMPLATE_VARIABLES } from "@/modules/communications/lib/template-engine";
import { PageContainer } from "@/shared/components/page-layout";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

const DEMO_VALUES: Partial<Record<(typeof TEMPLATE_VARIABLES)[number], string>> = {
  "customer.name": "Bruno Lima",
  "customer.phone": "(11) 97777-2002",
  "customer.whatsapp": "(11) 97777-2002",
  "sale.number": "V-01108",
  "installment.remaining": "R$ 630,00",
  "installment.dueDate": "10/10/2026",
  "company.name": "Empresa Exemplo Ltda.",
};

export function DemoCommunicationsComposeContent() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <CommunicationsSubnav variant="demo" active="compose" />
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
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="demo-recipient">Destinatário</Label>
                <Input id="demo-recipient" defaultValue="(11) 97777-2002" disabled />
              </div>
              <div className="space-y-1">
                <Label htmlFor="demo-body">Corpo da mensagem</Label>
                <textarea
                  id="demo-body"
                  rows={8}
                  disabled
                  defaultValue="Olá Bruno Lima, sua parcela de R$ 630,00 vence em 10/10/2026. Qualquer dúvida, estamos à disposição."
                  className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                />
              </div>
              <Button type="button" disabled>
                Preparar mensagem
              </Button>
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
                  {DEMO_VALUES[name] || "—"}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
