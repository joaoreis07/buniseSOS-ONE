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
  MEMBER_STATUS_LABELS,
  ROLE_LABELS,
  formatDateTimeBR,
} from "@/modules/team/lib/labels";

type MemberRow = {
  id: string;
  role: keyof typeof ROLE_LABELS;
  createdAt: Date;
  deletedAt: Date | null;
  active: boolean;
  lastAccessAt: Date | null;
  user: {
    name: string | null;
    email: string;
  };
};

export function TeamTable({ items }: { items: MemberRow[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        Nenhum membro encontrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Último acesso</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.user.name ?? item.user.email}
              </TableCell>
              <TableCell>{item.user.email}</TableCell>
              <TableCell>{ROLE_LABELS[item.role]}</TableCell>
              <TableCell>
                <Badge variant={item.active ? "secondary" : "outline"}>
                  {item.active
                    ? MEMBER_STATUS_LABELS.active
                    : MEMBER_STATUS_LABELS.inactive}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTimeBR(item.lastAccessAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTimeBR(item.createdAt)}
              </TableCell>
              <TableCell>
                <Link
                  href={`/app/settings/team/${item.id}`}
                  className="text-emerald-700 underline"
                >
                  Detalhes
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
