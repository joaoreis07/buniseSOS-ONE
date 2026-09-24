"use client";

import { useState } from "react";
import type { Customer } from "@prisma/client";
import type { CustomerListMetrics } from "@/modules/crm/repositories/customer.repository";
import { CustomerDetailDrawer } from "@/modules/crm/components/customer-detail-drawer";
import { CustomersTable } from "@/modules/crm/components/customers-table";

type CustomerRow = Customer & {
  owner: { id: string; name: string | null; email: string } | null;
  metrics: CustomerListMetrics;
};

export function CustomersListClient({
  items,
  canManage,
  canSales,
  canFinance,
}: {
  items: CustomerRow[];
  canManage: boolean;
  canSales: boolean;
  canFinance: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      <CustomersTable
        items={items}
        canManage={canManage}
        canSales={canSales}
        canFinance={canFinance}
        onSelect={(customer) => setSelectedId(customer.id)}
      />
      <CustomerDetailDrawer
        customerId={selectedId}
        onClose={() => setSelectedId(null)}
        canManage={canManage}
        canSales={canSales}
      />
    </>
  );
}
