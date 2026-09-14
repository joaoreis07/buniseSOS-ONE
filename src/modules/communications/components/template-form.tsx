"use client";

import { useActionState } from "react";
import {
  saveTemplateAction,
  type CommunicationActionResult,
} from "@/modules/communications/actions/communication.actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { TEMPLATE_VARIABLES } from "@/modules/communications/lib/template-engine";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type TemplateFormProps = {
  template?: {
    id: string;
    name: string;
    channel: string;
    type: string;
    subject: string | null;
    body: string;
    active: boolean;
  };
};

export function TemplateForm({ template }: TemplateFormProps) {
  const [state, action, pending] = useActionState(
    saveTemplateAction,
    undefined as CommunicationActionResult | undefined,
  );

  return (
    <form action={action} className="space-y-4">
      {template ? <input type="hidden" name="templateId" value={template.id} /> : null}
      <div className="space-y-1">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" required defaultValue={template?.name ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="channel">Canal</Label>
          <select
            id="channel"
            name="channel"
            defaultValue={template?.channel ?? "WHATSAPP"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            {Object.entries(COMMUNICATION_CHANNEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="type">Tipo</Label>
          <select
            id="type"
            name="type"
            defaultValue={template?.type ?? "MANUAL"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
          >
            {Object.entries(COMMUNICATION_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="subject">Assunto</Label>
        <Input id="subject" name="subject" defaultValue={template?.subject ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="body">Mensagem</Label>
        <Textarea id="body" name="body" required defaultValue={template?.body ?? ""} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={template?.active ?? true}
        />
        Ativo
      </label>
      <p className="text-xs text-muted-foreground">
        Variáveis: {TEMPLATE_VARIABLES.map((name) => `{{${name}}}`).join(" · ")}
      </p>
      {state?.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Salvando…" : "Salvar template"}
      </Button>
    </form>
  );
}
