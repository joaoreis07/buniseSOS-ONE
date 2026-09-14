"use client";

import { Button } from "@/shared/ui/button";

export function PrintButton() {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      Imprimir
    </Button>
  );
}
