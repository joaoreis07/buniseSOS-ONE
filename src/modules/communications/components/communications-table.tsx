import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_ORIGIN_LABELS,
  COMMUNICATION_STATUS_LABELS,
  COMMUNICATION_TYPE_LABELS,
} from "@/modules/communications/lib/labels";
import { formatDateTimeBR } from "@/modules/sales/lib/sale-labels";

type Item = {
  id: string;
  createdAt: Date;
  channel: keyof typeof COMMUNICATION_CHANNEL_LABELS;
  type: keyof typeof COMMUNICATION_TYPE_LABELS;
  status: keyof typeof COMMUNICATION_STATUS_LABELS;
  origin: keyof typeof COMMUNICATION_ORIGIN_LABELS;
  subject: string | null;
  customer: { id: string; name: string } | null;
  user: { name: string | null; email: string | null };
};

export function CommunicationsTable({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Nenhuma comunicação encontrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Assunto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="whitespace-nowrap">
                {formatDateTimeBR(item.createdAt)}
              </TableCell>
              <TableCell>
                {item.customer ? (
                  <Link
                    href={`/app/crm/${item.customer.id}`}
                    className="text-emerald-700 underline"
                  >
                    {item.customer.name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{COMMUNICATION_CHANNEL_LABELS[item.channel]}</TableCell>
              <TableCell>{COMMUNICATION_TYPE_LABELS[item.type]}</TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {COMMUNICATION_STATUS_LABELS[item.status]}
                </Badge>
              </TableCell>
              <TableCell>{COMMUNICATION_ORIGIN_LABELS[item.origin]}</TableCell>
              <TableCell>{item.user.name ?? item.user.email ?? "—"}</TableCell>
              <TableCell>
                <Link
                  href={`/app/communications/${item.id}`}
                  className="text-emerald-700 underline"
                >
                  {item.subject || "Ver mensagem"}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
