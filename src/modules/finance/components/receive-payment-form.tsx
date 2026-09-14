"use client";

import { useActionState, useState } from "react";
import { receivePaymentAction, type FinanceActionResult } from "@/modules/finance/actions/finance.actions";
import { PAYMENT_METHOD_LABELS, formatMoneyBRL } from "@/modules/sales/lib/sale-labels";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

export function ReceivePaymentForm({ installmentId, remainingAmount }: { installmentId: string; remainingAmount: unknown }) {
  const [state, action, pending] = useActionState<FinanceActionResult | undefined, FormData>(receivePaymentAction, undefined);
  const [method, setMethod] = useState("PIX");
  const amount = Number(remainingAmount);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2 rounded-md border p-3">
      <input type="hidden" name="installmentId" value={installmentId} />
      <input type="hidden" name="paymentMethod" value={method} />
      <div className="space-y-1">
        <Label htmlFor={`amount-${installmentId}`}>Receber</Label>
        <Input id={`amount-${installmentId}`} name="amount" type="number" min="0.01" max={amount} step="0.01" defaultValue={amount.toFixed(2)} className="w-32" />
      </div>
      <div className="space-y-1">
        <Label>Forma</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1 grow">
        <Label htmlFor={`notes-${installmentId}`}>Observação</Label>
        <Input id={`notes-${installmentId}`} name="notes" maxLength={2000} placeholder={`Saldo: ${formatMoneyBRL(remainingAmount)}`} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Registrando..." : "Dar baixa"}</Button>
      {state?.error ? <Alert variant="destructive" className="w-full"><AlertDescription>{state.error}</AlertDescription></Alert> : null}
    </form>
  );
}
