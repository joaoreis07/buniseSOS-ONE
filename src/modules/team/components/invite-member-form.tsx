"use client";

import { useActionState, useState } from "react";
import type { Role } from "@prisma/client";
import {
  inviteMemberAction,
  type TeamActionResult,
} from "@/modules/team/actions/team.actions";
import { ROLE_LABELS } from "@/modules/team/lib/labels";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export function InviteMemberForm({ allowedRoles }: { allowedRoles: Role[] }) {
  const [role, setRole] = useState<Role>(allowedRoles[0] ?? "SALES");
  const [state, formAction, pending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(inviteMemberAction, undefined);

  if (allowedRoles.length === 0) return null;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">E-mail do convidado</Label>
        <Input id="invite-email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Função</Label>
        <input type="hidden" name="role" value={role} />
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger id="invite-role">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {allowedRoles.map((value) => (
              <SelectItem key={value} value={value}>
                {ROLE_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state?.ok ? (
        <Alert>
          <AlertDescription>
            {state.message}
            {state.token ? ` Token: ${state.token}` : null}
          </AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Convidando..." : "Enviar convite"}
      </Button>
    </form>
  );
}
