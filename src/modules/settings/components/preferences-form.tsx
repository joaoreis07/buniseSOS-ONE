"use client";

import { useActionState } from "react";
import {
  updatePreferencesAction,
  type SettingsActionResult,
} from "@/modules/settings/actions/settings.actions";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

export function PreferencesForm({
  language,
  currency,
  timezone,
  dateFormat,
  theme,
  canManage,
}: {
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  theme: string;
  canManage: boolean;
}) {
  const [state, action, pending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(updatePreferencesAction, undefined);

  return (
    <form action={action} className="grid max-w-xl gap-4">
      <SelectField
        label="Idioma"
        name="language"
        defaultValue={language}
        disabled={!canManage}
        options={[{ value: "pt-BR", label: "Português (Brasil)" }]}
      />
      <SelectField
        label="Moeda"
        name="currency"
        defaultValue={currency}
        disabled={!canManage}
        options={[{ value: "BRL", label: "Real (BRL)" }]}
      />
      <SelectField
        label="Fuso horário"
        name="timezone"
        defaultValue={timezone}
        disabled={!canManage}
        options={[{ value: "America/Sao_Paulo", label: "America/Sao_Paulo" }]}
      />
      <SelectField
        label="Formato de data"
        name="dateFormat"
        defaultValue={dateFormat}
        disabled={!canManage}
        options={[{ value: "dd/MM/yyyy", label: "dd/MM/yyyy" }]}
      />
      <SelectField
        label="Tema"
        name="theme"
        defaultValue={theme}
        disabled={!canManage}
        options={[{ value: "light", label: "Claro" }]}
      />
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-emerald-700">Preferências atualizadas.</p>
      ) : null}
      {canManage ? (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar preferências"}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Somente administradores e gestores podem alterar preferências.
        </p>
      )}
    </form>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
