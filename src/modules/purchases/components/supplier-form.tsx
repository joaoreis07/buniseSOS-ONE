"use client";

import { useActionState, useState } from "react";
import type { Supplier, SupplierStatus } from "@prisma/client";
import {
  createSupplierAction,
  updateSupplierAction,
  type SupplierActionResult,
} from "@/modules/purchases/actions/supplier.actions";
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

export function SupplierForm({
  mode,
  supplier,
}: {
  mode: "create" | "edit";
  supplier?: Supplier;
}) {
  const action = mode === "create" ? createSupplierAction : updateSupplierAction;
  const [state, formAction, pending] = useActionState<
    SupplierActionResult | undefined,
    FormData
  >(action, undefined);
  const [status, setStatus] = useState<SupplierStatus>(
    supplier?.status ?? "ACTIVE",
  );

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && supplier ? (
        <input type="hidden" name="supplierId" value={supplier.id} />
      ) : null}
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="country" value={supplier?.country ?? "BR"} />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Nome / razão social</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={supplier?.name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeName">Nome fantasia</Label>
          <Input
            id="tradeName"
            name="tradeName"
            defaultValue={supplier?.tradeName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">CPF/CNPJ</Label>
          <Input
            id="document"
            name="document"
            defaultValue={supplier?.document ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={supplier?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile">Celular</Label>
          <Input
            id="mobile"
            name="mobile"
            defaultValue={supplier?.mobile ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as SupplierStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            name="zipCode"
            defaultValue={supplier?.zipCode ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            name="street"
            defaultValue={supplier?.street ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            name="number"
            defaultValue={supplier?.number ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            defaultValue={supplier?.complement ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">Bairro</Label>
          <Input
            id="district"
            name="district"
            defaultValue={supplier?.district ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" defaultValue={supplier?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input
            id="state"
            name="state"
            maxLength={2}
            defaultValue={supplier?.state ?? ""}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={supplier?.notes ?? ""}
            className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending
          ? "Salvando..."
          : mode === "create"
            ? "Cadastrar fornecedor"
            : "Salvar alterações"}
      </Button>
    </form>
  );
}
