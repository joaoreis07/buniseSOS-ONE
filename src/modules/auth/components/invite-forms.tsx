"use client";

import { useActionState, useState } from "react";
import type { Role } from "@prisma/client";
import {
  acceptInviteAction,
  inviteMemberAction,
  type ActionResult,
} from "@/modules/auth/actions/auth.actions";
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

export function InviteMemberForm() {
  const [role, setRole] = useState<Role>("SALES");
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    inviteMemberAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail do convidado</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Papel</Label>
        <input type="hidden" name="role" value={role} />
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger id="role">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
            <SelectItem value="MANAGER">MANAGER</SelectItem>
            <SelectItem value="SALES">SALES</SelectItem>
            <SelectItem value="FINANCE">FINANCE</SelectItem>
            <SelectItem value="INVENTORY">INVENTORY</SelectItem>
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
        {pending ? "Convidando..." : "Convidar membro"}
      </Button>
    </form>
  );
}

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | undefined, FormData>(
    acceptInviteAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="name">Seu nome</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Aceitando..." : "Aceitar convite"}
      </Button>
    </form>
  );
}
