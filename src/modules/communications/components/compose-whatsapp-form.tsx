"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  prepareWhatsAppAction,
  type CommunicationActionResult,
} from "@/modules/communications/actions/communication.actions";
import { renderTemplate, type TemplateValues } from "@/modules/communications/lib/template-engine";
import { WHATSAPP_MANUAL_DISCLAIMER } from "@/modules/communications/lib/labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Alert, AlertDescription } from "@/shared/ui/alert";

type TemplateOption = {
  id: string;
  name: string;
  type: string;
  body: string;
  subject: string | null;
};

type ComposeWhatsAppFormProps = {
  customerId?: string | null;
  saleId?: string | null;
  installmentId?: string | null;
  activityId?: string | null;
  origin: string;
  type: string;
  intent?: string | null;
  recipient: string | null;
  customerName?: string | null;
  templates: TemplateOption[];
  selectedTemplateId?: string | null;
  values: TemplateValues;
  initialBody: string;
};

export function ComposeWhatsAppForm({
  customerId,
  saleId,
  installmentId,
  activityId,
  origin,
  type,
  intent,
  recipient,
  customerName,
  templates,
  selectedTemplateId,
  values,
  initialBody,
}: ComposeWhatsAppFormProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(selectedTemplateId ?? "");
  const [body, setBody] = useState(initialBody);
  const [state, action, pending] = useActionState(
    prepareWhatsAppAction,
    undefined as CommunicationActionResult | undefined,
  );

  const preview = useMemo(
    () => renderTemplate(body, values).text,
    [body, values],
  );

  useEffect(() => {
    if (!state?.ok || !state.url || !state.id) return;
    toast.message("Mensagem preparada. O WhatsApp não envia automaticamente.");
    window.open(state.url, "_blank", "noopener,noreferrer");
    router.push(`/app/communications/${state.id}`);
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId ?? ""} />
      <input type="hidden" name="saleId" value={saleId ?? ""} />
      <input type="hidden" name="installmentId" value={installmentId ?? ""} />
      <input type="hidden" name="activityId" value={activityId ?? ""} />
      <input type="hidden" name="channel" value="WHATSAPP" />
      <input type="hidden" name="origin" value={origin} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="intent" value={intent ?? ""} />
      <input type="hidden" name="templateId" value={templateId} />

      <Alert>
        <AlertDescription>{WHATSAPP_MANUAL_DISCLAIMER}</AlertDescription>
      </Alert>

      {customerName ? (
        <p className="text-sm text-muted-foreground">Cliente: {customerName}</p>
      ) : null}

      <div className="space-y-1">
        <Label htmlFor="template">Template</Label>
        <select
          id="template"
          value={templateId}
          onChange={(event) => {
            const nextId = event.target.value;
            setTemplateId(nextId);
            const next = templates.find((item) => item.id === nextId);
            if (next) setBody(next.body);
          }}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
        >
          <option value="">Mensagem livre</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="recipient">WhatsApp</Label>
        <Input
          id="recipient"
          name="recipient"
          defaultValue={recipient ?? ""}
          placeholder="11999999999"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" maxLength={160} />
      </div>

      <div className="space-y-1">
        <Label htmlFor="body">Mensagem</Label>
        <Textarea
          id="body"
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
        />
      </div>

      <div className="space-y-1 rounded-md border bg-muted/40 p-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Pré-visualização
        </p>
        <p className="whitespace-pre-wrap text-sm">{preview || "—"}</p>
      </div>

      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Preparando…" : "Preparar WhatsApp"}
      </Button>
    </form>
  );
}
