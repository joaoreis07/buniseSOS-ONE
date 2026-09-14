import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_STATUS_LABELS,
} from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { RecordManualCommunicationForm } from "@/modules/communications/components/record-manual-form";

type CommunicationItem = {
  id: string;
  createdAt: Date;
  channel: keyof typeof COMMUNICATION_CHANNEL_LABELS;
  status: keyof typeof COMMUNICATION_STATUS_LABELS;
  subject: string | null;
  body: string;
  user: { name: string | null; email: string | null };
};

export function CustomerCommunicationsPanel({
  customerId,
  items,
  canSend,
  hasWhatsApp,
}: {
  customerId: string;
  items: CommunicationItem[];
  canSend: boolean;
  hasWhatsApp: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Comunicações</CardTitle>
          <CardDescription>
            Histórico de mensagens preparadas ou registradas — separado das
            atividades do CRM.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSend ? (
            <Button asChild>
              <Link
                href={`/app/communications/new?customerId=${customerId}&intent=followup`}
              >
                {hasWhatsApp ? "Enviar WhatsApp" : "Preparar WhatsApp"}
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/app/communications?customerId=${customerId}`}>
              Ver histórico
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma comunicação registrada para este cliente.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-md border px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/app/communications/${item.id}`}
                    className="font-medium text-emerald-700 underline"
                  >
                    {item.subject || COMMUNICATION_CHANNEL_LABELS[item.channel]}
                  </Link>
                  <Badge variant="secondary">
                    {COMMUNICATION_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-muted-foreground">
                  {item.body}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDateTimeBR(item.createdAt)} ·{" "}
                  {item.user.name ?? item.user.email ?? "Sistema"}
                </p>
              </li>
            ))}
          </ul>
        )}
        {canSend ? (
          <div className="border-t pt-4">
            <p className="mb-3 text-sm font-medium">Registrar comunicação manual</p>
            <RecordManualCommunicationForm customerId={customerId} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
