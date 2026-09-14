import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/shared/auth/session";
import { prisma } from "@/shared/db/prisma";
import { getReceivableForTenant, canReceiveFinance } from "@/modules/finance/services/finance.service";
import { formatDateBR, RECEIVABLE_STATUS_LABELS } from "@/modules/finance/lib/finance-labels";
import { formatMoneyBRL, PAYMENT_METHOD_LABELS, formatDateTimeBR } from "@/modules/sales/lib/sale-labels";
import { ReceivePaymentForm } from "@/modules/finance/components/receive-payment-form";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { canSendCommunications } from "@/modules/communications/services/communication.service";

export default async function ReceivableDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("finance:view");
  const { id } = await params;
  const account = await getReceivableForTenant({ companyId: user.companyId, role: user.role, id });
  if (!account) notFound();
  const history = await prisma.auditLog.findMany({ where: { companyId: user.companyId, module: "finance", OR: [{ entityId: account.id }, { entityId: { in: account.installments.map((item) => item.id) } }] }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, action: true, createdAt: true, user: { select: { name: true, email: true } } } });
  const canReceive = canReceiveFinance(user.role);
  const canSendWhatsApp =
    canSendCommunications(user.role) && Boolean(account.customer);
  const summaryCards = [
    { title: "Total", value: formatMoneyBRL(account.totalAmount) },
    { title: "Pago", value: formatMoneyBRL(account.paidAmount) },
    { title: "Saldo", value: formatMoneyBRL(account.remainingAmount) },
    { title: "Último vencimento", value: formatDateBR(account.dueDate) },
  ];
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight">Conta da venda V-{String(account.sale.number).padStart(5, "0")}</h1><Badge>{RECEIVABLE_STATUS_LABELS[account.status]}</Badge></div><p className="text-muted-foreground">{account.customer?.name ?? "Venda sem cliente"} · {PAYMENT_METHOD_LABELS[account.paymentMethod]}</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link href="/app/finance">Voltar</Link></Button><Button asChild variant="outline"><Link href={`/app/sales/${account.sale.id}`}>Ver venda</Link></Button>{canSendWhatsApp && account.customer ? <Button asChild><Link href={`/app/communications/new?customerId=${account.customer.id}&saleId=${account.sale.id}&intent=charge`}>Enviar cobrança pelo WhatsApp</Link></Button> : null}</div></div>
    <div className="grid gap-4 md:grid-cols-4">{summaryCards.map((item) => <Card key={item.title}><CardHeader><CardTitle className="text-sm">{item.title}</CardTitle></CardHeader><CardContent className="text-xl font-semibold">{item.value}</CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Parcelas</CardTitle></CardHeader><CardContent className="space-y-3">{account.installments.map((installment) => <div key={installment.id} className="space-y-3 rounded-lg border p-3"><div className="flex flex-wrap items-center justify-between gap-2 text-sm"><span className="font-medium">Parcela {installment.number}</span><span>Vence em {formatDateBR(installment.dueDate)}</span><Badge>{RECEIVABLE_STATUS_LABELS[installment.status]}</Badge><span>Total {formatMoneyBRL(installment.amount)}</span><span>Pago {formatMoneyBRL(installment.paidAmount)}</span><span className="font-medium">Saldo {formatMoneyBRL(installment.remainingAmount)}</span>{canSendWhatsApp && account.customer && installment.status !== "PAID" && installment.status !== "CANCELLED" ? <Link href={`/app/communications/new?customerId=${account.customer.id}&saleId=${account.sale.id}&installmentId=${installment.id}&intent=charge`} className="text-emerald-700 underline">WhatsApp</Link> : null}</div>{canReceive && installment.status !== "PAID" && installment.status !== "CANCELLED" ? <ReceivePaymentForm installmentId={installment.id} remainingAmount={installment.remainingAmount} /> : null}{installment.payments.length > 0 ? <ul className="space-y-1 text-sm text-muted-foreground">{installment.payments.map((payment) => <li key={payment.id}>{formatDateTimeBR(payment.paidAt)} · {formatMoneyBRL(payment.amount)} · {PAYMENT_METHOD_LABELS[payment.paymentMethod]} · {payment.paidBy?.name ?? payment.paidBy?.email ?? "Sistema"}{payment.notes ? ` · ${payment.notes}` : ""}</li>)}</ul> : null}</div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent>{history.length === 0 ? <p className="text-sm text-muted-foreground">Sem eventos financeiros.</p> : <ul className="space-y-2 text-sm">{history.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-2 rounded-md border px-3 py-2"><span><span className="font-medium">{item.action}</span> · {item.user?.name ?? item.user?.email ?? "Sistema"}</span><span className="text-muted-foreground">{formatDateTimeBR(item.createdAt)}</span></li>)}</ul>}</CardContent></Card>
  </div>;
}
