"use client";

import { useActionState, useState } from "react";
import type { Role } from "@prisma/client";
import {
  activateMemberAction,
  changeMemberRoleAction,
  deactivateMemberAction,
  type TeamActionResult,
} from "@/modules/team/actions/team.actions";
import { ROLE_LABELS } from "@/modules/team/lib/labels";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

type MemberActionsProps = {
  membershipId: string;
  currentRole: Role;
  active: boolean;
  allowedRoles: Role[];
  canManage: boolean;
};

function ActionAlert({ state }: { state: TeamActionResult | undefined }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <Alert variant={state.error ? "destructive" : "default"}>
      <AlertDescription>{state.error ?? state.message}</AlertDescription>
    </Alert>
  );
}

export function MemberActions({
  membershipId,
  currentRole,
  active,
  allowedRoles,
  canManage,
}: MemberActionsProps) {
  const [role, setRole] = useState<Role>(currentRole);
  const [roleState, roleAction, rolePending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(changeMemberRoleAction, undefined);
  const [deactivateState, deactivateAction, deactivatePending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(deactivateMemberAction, undefined);
  const [activateState, activateAction, activatePending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(activateMemberAction, undefined);

  if (!canManage) return null;

  return (
    <div className="space-y-4">
      {active && allowedRoles.length > 0 ? (
        <form action={roleAction} className="space-y-3">
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="role" value={role} />
          <div className="space-y-2">
            <Label htmlFor="member-role">Alterar função</Label>
            <Select value={role} onValueChange={(value) => setRole(value as Role)}>
              <SelectTrigger id="member-role">
                <SelectValue />
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
          <ActionAlert state={roleState} />
          <Button type="submit" disabled={rolePending || role === currentRole}>
            {rolePending ? "Salvando..." : "Salvar função"}
          </Button>
        </form>
      ) : null}

      {active ? (
        <form
          action={deactivateAction}
          onSubmit={(event) => {
            if (!window.confirm("Desativar este membro? O histórico será preservado.")) {
              event.preventDefault();
            }
          }}
          className="space-y-2"
        >
          <input type="hidden" name="membershipId" value={membershipId} />
          <ActionAlert state={deactivateState} />
          <Button type="submit" variant="destructive" disabled={deactivatePending}>
            {deactivatePending ? "Desativando..." : "Desativar membro"}
          </Button>
        </form>
      ) : (
        <form action={activateAction} className="space-y-2">
          <input type="hidden" name="membershipId" value={membershipId} />
          <ActionAlert state={activateState} />
          <Button type="submit" disabled={activatePending}>
            {activatePending ? "Reativando..." : "Reativar membro"}
          </Button>
        </form>
      )}
    </div>
  );
}
