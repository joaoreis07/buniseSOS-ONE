"use client";

import { useActionState } from "react";
import {
  updateDocumentSettingsAction,
  type SettingsActionResult,
} from "@/modules/settings/actions/settings.actions";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function DocumentSettingsForm({
  canManage,
  documentTitle,
  documentHeader,
  documentFooter,
  communicationSignature,
  defaultSaleNotes,
  defaultPurchaseNotes,
  defaultReceiptNotes,
  allowSaleWithoutCustomer,
  defaultInstallmentCount,
}: {
  canManage: boolean;
  documentTitle: string | null;
  documentHeader: string | null;
  documentFooter: string | null;
  communicationSignature: string | null;
  defaultSaleNotes: string | null;
  defaultPurchaseNotes: string | null;
  defaultReceiptNotes: string | null;
  allowSaleWithoutCustomer: boolean;
  defaultInstallmentCount: number;
}) {
  const [state, action, pending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(updateDocumentSettingsAction, undefined);

  return (
    <form action={action} className="grid gap-4">
      <div className="space-y-2">
        <Label htmlFor="documentTitle">Título padrão</Label>
        <Input
          id="documentTitle"
          name="documentTitle"
          defaultValue={documentTitle ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="documentHeader">Cabeçalho</Label>
        <Textarea
          id="documentHeader"
          name="documentHeader"
          defaultValue={documentHeader ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="documentFooter">Rodapé</Label>
        <Textarea
          id="documentFooter"
          name="documentFooter"
          defaultValue={documentFooter ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="communicationSignature">Assinatura / rodapé de comunicação</Label>
        <Textarea
          id="communicationSignature"
          name="communicationSignature"
          defaultValue={communicationSignature ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultSaleNotes">Observação padrão de venda</Label>
        <Textarea
          id="defaultSaleNotes"
          name="defaultSaleNotes"
          defaultValue={defaultSaleNotes ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultPurchaseNotes">Observação padrão de compra</Label>
        <Textarea
          id="defaultPurchaseNotes"
          name="defaultPurchaseNotes"
          defaultValue={defaultPurchaseNotes ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultReceiptNotes">Texto padrão de recibo</Label>
        <Textarea
          id="defaultReceiptNotes"
          name="defaultReceiptNotes"
          defaultValue={defaultReceiptNotes ?? ""}
          disabled={!canManage}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="defaultInstallmentCount">Parcelas padrão</Label>
        <Input
          id="defaultInstallmentCount"
          name="defaultInstallmentCount"
          type="number"
          min={1}
          max={24}
          defaultValue={defaultInstallmentCount}
          disabled={!canManage}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="allowSaleWithoutCustomer"
          defaultChecked={allowSaleWithoutCustomer}
          disabled={!canManage}
          value="true"
        />
        Permitir venda sem cliente
      </label>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700">Configurações de documentos atualizadas.</p>
      ) : null}
      {canManage ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar documentos"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Usuários operacionais podem emitir recibos, mas não alteram estes textos.
        </p>
      )}
    </form>
  );
}
