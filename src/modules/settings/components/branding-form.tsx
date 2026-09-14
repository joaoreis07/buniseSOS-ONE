"use client";

import { useActionState } from "react";
import {
  removeCompanyLogoAction,
  updateBrandingAction,
  uploadCompanyLogoAction,
  type SettingsActionResult,
} from "@/modules/settings/actions/settings.actions";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

export function BrandingForm({
  displayName,
  primaryColor,
  secondaryColor,
  hasLogo,
  canManage,
}: {
  displayName: string | null;
  primaryColor: string;
  secondaryColor: string;
  hasLogo: boolean;
  canManage: boolean;
}) {
  const [brandState, brandAction, brandPending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(updateBrandingAction, undefined);
  const [logoState, logoAction, logoPending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(uploadCompanyLogoAction, undefined);
  const [removeState, removeAction, removePending] = useActionState<
    SettingsActionResult | undefined,
    FormData
  >(removeCompanyLogoAction, undefined);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={brandAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="displayName">Nome exibido</Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={displayName ?? ""}
            disabled={!canManage}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Cor principal</Label>
            <Input
              id="primaryColor"
              name="primaryColor"
              type="color"
              defaultValue={primaryColor}
              disabled={!canManage}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Cor secundária</Label>
            <Input
              id="secondaryColor"
              name="secondaryColor"
              type="color"
              defaultValue={secondaryColor}
              disabled={!canManage}
            />
          </div>
        </div>
        {brandState?.error ? (
          <Alert variant="destructive">
            <AlertDescription>{brandState.error}</AlertDescription>
          </Alert>
        ) : null}
        {brandState?.ok ? (
          <p className="text-sm text-emerald-700">Identidade visual atualizada.</p>
        ) : null}
        {canManage ? (
          <Button type="submit" disabled={brandPending}>
            {brandPending ? "Salvando..." : "Salvar identidade"}
          </Button>
        ) : null}
      </form>

      <div className="space-y-4">
        {hasLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/app/files/logo"
            alt="Logo da empresa"
            className="h-20 w-20 rounded-md border object-contain"
          />
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma logo enviada.</p>
        )}
        <form action={logoAction} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo (JPEG ou PNG, até 2 MB)</Label>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png"
              disabled={!canManage}
            />
          </div>
          {logoState?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{logoState.error}</AlertDescription>
            </Alert>
          ) : null}
          {logoState?.ok ? (
            <p className="text-sm text-emerald-700">Logo atualizada.</p>
          ) : null}
          {canManage ? (
            <Button type="submit" disabled={logoPending}>
              {logoPending ? "Enviando..." : "Enviar logo"}
            </Button>
          ) : null}
        </form>
        {canManage && hasLogo ? (
          <form action={removeAction}>
            {removeState?.error ? (
              <Alert variant="destructive">
                <AlertDescription>{removeState.error}</AlertDescription>
              </Alert>
            ) : null}
            <Button type="submit" variant="outline" disabled={removePending}>
              {removePending ? "Removendo..." : "Remover logo"}
            </Button>
          </form>
        ) : null}
        {!canManage ? (
          <p className="text-sm text-muted-foreground">
            Somente administradores e gestores podem alterar a identidade visual.
          </p>
        ) : null}
      </div>
    </div>
  );
}
