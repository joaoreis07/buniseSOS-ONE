import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { prisma } from "@/shared/db/prisma";
import {
  canSendCommunications,
  getCommunicationForTenant,
} from "@/modules/communications/services/communication.service";
import { CommunicationsSubnav } from "@/modules/communications/components/communications-subnav";
import {
  CancelCommunicationButton,
  OpenWhatsAppButton,
} from "@/modules/communications/components/communication-actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
  WHATSAPP_MANUAL_DISCLAIMER,
} from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermission("communications:view");
  const { id } = await params;
  const communication = await getCommunicationForTenant({
    companyId: user.companyId,
    role: user.role,
    communicationId: id,
  });
  if (!communication) notFound();
  const canSend = canSendCommunications(user.role);
  const canOpen =
    canSend &&
    communication.channel === "WHATSAPP" &&
    communication.status !== "CANCELLED" &&
    communication.status !== "SENT" &&
    Boolean(communication.externalId);
  const canCancel =
    canSend &&
    communication.status !== "CANCELLED" &&
    communication.status !== "SENT" &&
    communication.status !== "DELIVERED";

  const history = await prisma.auditLog.findMany({
    where: {
      companyId: user.companyId,
      entity: "Communication",
      entityId: communication.id,
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <CommunicationsSubnav role={user.role} active="history" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {communication.subject || "Comunicação"}
            </h1>
            <Badge>{COMMUNICATION_STATUS_LABELS[communication.status]}</Badge>
          </div>
          <p className="text-muted-foreground">
            {COMMUNICATION_CHANNEL_LABELS[communication.channel]} ·{" "}
            {COMMUNICATION_TYPE_LABELS[communication.type]} ·{" "}
            {COMMUNICATION_ORIGIN_LABELS[communication.origin]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/app/communications">Voltar</Link>
          </Button>
          {canCancel ? (
            <CancelCommunicationButton communicationId={communication.id} />
          ) : null}
        </div>
      </div>

      {communication.status !== "SENT" && communication.channel === "WHATSAPP" ? (
        <p className="text-sm text-muted-foreground">{WHATSAPP_MANUAL_DISCLAIMER}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Destino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Cliente:{" "}
              {communication.customer ? (
                <Link
                  href={`/app/crm/${communication.customer.id}`}
                  className="text-emerald-700 underline"
                >
                  {communication.customer.name}
                </Link>
              ) : (
                "—"
              )}
            </p>
            <p>Destinatário: {communication.recipient || "—"}</p>
            <p>
              Responsável:{" "}
              {communication.user.name ?? communication.user.email ?? "—"}
            </p>
            <p>Preparada em: {formatDateTimeBR(communication.preparedAt)}</p>
            <p>Iniciada em: {formatDateTimeBR(communication.openedAt)}</p>
            <p>
              Enviada em:{" "}
              {communication.sentAt
                ? formatDateTimeBR(communication.sentAt)
                : "Não confirmado"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Template: {communication.template?.name ?? "—"}</p>
            {communication.sale ? (
              <p>
                Venda:{" "}
                <Link
                  href={`/app/sales/${communication.sale.id}`}
                  className="text-emerald-700 underline"
                >
                  V-{String(communication.sale.number).padStart(5, "0")}
                </Link>
              </p>
            ) : (
              <p>Venda: —</p>
            )}
            <p>
              Parcela:{" "}
              {communication.installment
                ? `#${communication.installment.number}`
                : "—"}
            </p>
            {communication.activity ? (
              <p>
                Atividade:{" "}
                <Link
                  href={`/app/crm/activities/${communication.activity.id}`}
                  className="text-emerald-700 underline"
                >
                  {communication.activity.title}
                </Link>
              </p>
            ) : (
              <p>Atividade: —</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm">{communication.body}</p>
          {canOpen ? (
            <OpenWhatsAppButton
              communicationId={communication.id}
              url={communication.externalId}
            />
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem eventos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2"
                >
                  <span>
                    <span className="font-medium">{item.action}</span>
                    {" · "}
                    {item.user?.name ?? item.user?.email ?? "Sistema"}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateTimeBR(item.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
