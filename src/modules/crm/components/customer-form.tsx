"use client";

import { useActionState, useState } from "react";
import type { Customer, CustomerStatus, CustomerType } from "@prisma/client";
import {
  createCustomerAction,
  updateCustomerAction,
  type CustomerActionResult,
} from "@/modules/crm/actions/customer.actions";
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

type OwnerOption = {
  id: string;
  name: string | null;
  email: string;
};

type CustomerFormProps = {
  mode: "create" | "edit";
  customer?: Customer;
  owners: OwnerOption[];
};

export function CustomerForm({ mode, customer, owners }: CustomerFormProps) {
  const action = mode === "create" ? createCustomerAction : updateCustomerAction;
  const [state, formAction, pending] = useActionState<
    CustomerActionResult | undefined,
    FormData
  >(action, undefined);

  const [type, setType] = useState<CustomerType>(customer?.type ?? "INDIVIDUAL");
  const [status, setStatus] = useState<CustomerStatus>(
    customer?.status ?? "ACTIVE",
  );
  const [ownerId, setOwnerId] = useState<string>(customer?.ownerId ?? "");

  return (
    <form action={formAction} className="space-y-6">
      {mode === "edit" && customer ? (
        <input type="hidden" name="customerId" value={customer.id} />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Identificação
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <input type="hidden" name="type" value={type} />
          <Select
            value={type}
            onValueChange={(value) => setType(value as CustomerType)}
          >
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INDIVIDUAL">Pessoa física</SelectItem>
              <SelectItem value="COMPANY">Pessoa jurídica</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <input type="hidden" name="status" value={status} />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as CustomerStatus)}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
              <SelectItem value="BLOCKED">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={customer?.name ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeName">Nome fantasia</Label>
          <Input
            id="tradeName"
            name="tradeName"
            defaultValue={customer?.tradeName ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="document">CPF/CNPJ</Label>
          <Input
            id="document"
            name="document"
            defaultValue={customer?.document ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="origin">Origem</Label>
          <Input
            id="origin"
            name="origin"
            placeholder="Indicação, site, redes..."
            defaultValue={customer?.origin ?? ""}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Contato
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile">Celular</Label>
          <Input
            id="mobile"
            name="mobile"
            defaultValue={customer?.mobile ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={customer?.whatsapp ?? ""}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Endereço
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            name="zipCode"
            defaultValue={customer?.zipCode ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="street">Rua</Label>
          <Input
            id="street"
            name="street"
            defaultValue={customer?.street ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            name="number"
            defaultValue={customer?.number ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            name="complement"
            defaultValue={customer?.complement ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="district">Bairro</Label>
          <Input
            id="district"
            name="district"
            defaultValue={customer?.district ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" name="city" defaultValue={customer?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">UF</Label>
          <Input
            id="state"
            name="state"
            maxLength={2}
            defaultValue={customer?.state ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">País</Label>
          <Input
            id="country"
            name="country"
            maxLength={2}
            defaultValue={customer?.country ?? "BR"}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Comercial
          </h2>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ownerId">Responsável</Label>
          <input type="hidden" name="ownerId" value={ownerId} />
          <Select
            value={ownerId || "none"}
            onValueChange={(value) => setOwnerId(value === "none" ? "" : value)}
          >
            <SelectTrigger id="ownerId">
              <SelectValue placeholder="Sem responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem responsável</SelectItem>
              {owners.map((owner) => (
                <SelectItem key={owner.id} value={owner.id}>
                  {owner.name ?? owner.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            defaultValue={customer?.notes ?? ""}
            className="flex min-h-[96px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </section>

      {state?.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Salvando..."
            : mode === "create"
              ? "Criar cliente"
              : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
