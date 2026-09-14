"use client";

import { useActionState } from "react";
import {
  updateCompanyProfileAction,
  type SettingsActionResult,
} from "@/modules/settings/actions/settings.actions";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

type Company = {
  name: string;
  tradeName: string | null;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  description: string | null;
  zipCode: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export function CompanyProfileForm({
  company,
  canManage,
}: {
  company: Company;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(updateCompanyProfileAction, undefined);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nome da empresa" name="name" defaultValue={company.name} required disabled={!canManage} />
      <Field label="Nome fantasia" name="tradeName" defaultValue={company.tradeName} disabled={!canManage} />
      <Field label="Documento" name="document" defaultValue={company.document} disabled={!canManage} />
      <Field label="E-mail" name="email" type="email" defaultValue={company.email} disabled={!canManage} />
      <Field label="Telefone" name="phone" defaultValue={company.phone} disabled={!canManage} />
      <Field label="WhatsApp" name="whatsapp" defaultValue={company.whatsapp} disabled={!canManage} />
      <Field label="Site" name="website" defaultValue={company.website} disabled={!canManage} />
      <Field label="CEP" name="zipCode" defaultValue={company.zipCode} disabled={!canManage} />
      <Field label="Endereço" name="street" defaultValue={company.street} disabled={!canManage} />
      <Field label="Número" name="number" defaultValue={company.number} disabled={!canManage} />
      <Field label="Complemento" name="complement" defaultValue={company.complement} disabled={!canManage} />
      <Field label="Bairro" name="district" defaultValue={company.district} disabled={!canManage} />
      <Field label="Cidade" name="city" defaultValue={company.city} disabled={!canManage} />
      <Field label="Estado" name="state" defaultValue={company.state} maxLength={2} disabled={!canManage} />
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={company.description ?? ""}
          disabled={!canManage}
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive" className="sm:col-span-2">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700 sm:col-span-2">Dados da empresa atualizados.</p>
      ) : null}
      {canManage ? (
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar empresa"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground sm:col-span-2">
          Somente administradores e gestores podem alterar estes dados.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  disabled,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
      />
    </div>
  );
}
