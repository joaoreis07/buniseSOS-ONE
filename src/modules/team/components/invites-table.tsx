"use client";

import { useActionState } from "react";
import type { InviteStatus } from "@prisma/client";
import {
  resendInviteAction,
  revokeInviteAction,
  type TeamActionResult,
} from "@/modules/team/actions/team.actions";
import {
  INVITE_STATUS_LABELS,
  ROLE_LABELS,
  formatDateTimeBR,
} from "@/modules/team/lib/labels";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

type InviteRow = {
  id: string;
  email: string;
  role: keyof typeof ROLE_LABELS;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
  invitedBy: { name: string | null; email: string } | null;
};

function InviteActionAlert({ state }: { state: TeamActionResult | undefined }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <Alert variant={state.error ? "destructive" : "default"}>
      <AlertDescription>{state.error ?? state.message}</AlertDescription>
    </Alert>
  );
}

export function InvitesTable({
  items,
  canManage,
}: {
  items: InviteRow[];
  canManage: boolean;
}) {
  const [resendState, resendAction, resendPending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(resendInviteAction, undefined);
  const [revokeState, revokeAction, revokePending] = useActionState<
    TeamActionResult | undefined,
    FormData
  >(revokeInviteAction, undefined);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhum convite registrado.</p>
    );
  }

  return (
    <div className="space-y-3">
      <InviteActionAlert state={resendState} />
      <InviteActionAlert state={revokeState} />
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>E-mail</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Convidado por</TableHead>
              {canManage ? <TableHead /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.email}</TableCell>
                <TableCell>{ROLE_LABELS[item.role]}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {INVITE_STATUS_LABELS[item.status]}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateTimeBR(item.expiresAt)}
                </TableCell>
                <TableCell>
                  {item.invitedBy?.name ?? item.invitedBy?.email ?? "—"}
                </TableCell>
                {canManage ? (
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "ACCEPTED" ? (
                        <form action={resendAction}>
                          <input type="hidden" name="inviteId" value={item.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={resendPending}
                          >
                            Reenviar
                          </Button>
                        </form>
                      ) : null}
                      {item.status === "PENDING" ? (
                        <form action={revokeAction}>
                          <input type="hidden" name="inviteId" value={item.id} />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            disabled={revokePending}
                          >
                            Cancelar
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
