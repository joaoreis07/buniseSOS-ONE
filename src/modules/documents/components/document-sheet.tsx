import Link from "next/link";
import { formatOperationalDocumentNumber } from "@/modules/documents/lib/document-labels";
import type { OperationalDocumentView } from "@/modules/documents/lib/document-view";
import { PrintButton } from "@/modules/documents/components/print-button";
import { Button } from "@/shared/ui/button";

export function DocumentSheet({ view }: { view: OperationalDocumentView }) {
  const number = formatOperationalDocumentNumber(
    view.document.kind,
    view.document.number,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 print:hidden">
        <Button asChild variant="outline">
          <Link href={view.backHref}>Voltar</Link>
        </Button>
        <PrintButton />
        <Button asChild>
          <a href={view.pdfHref}>Baixar PDF</a>
        </Button>
      </div>

      <article
        data-print-document
        className="mx-auto max-w-3xl space-y-6 rounded-lg border bg-white p-6 text-slate-900 shadow-sm md:p-8"
        style={{ borderTopColor: view.branding.primaryColor, borderTopWidth: 6 }}
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {view.branding.hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/app/files/logo"
                alt=""
                className="h-14 w-14 rounded-md object-contain"
              />
            ) : null}
            <div>
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Documento operacional
              </p>
              <h1 className="text-xl font-semibold tracking-tight">
                {view.branding.documentTitle}
              </h1>
              <p className="font-medium">{view.company.displayName}</p>
              {view.company.document ? (
                <p className="text-sm text-muted-foreground">{view.company.document}</p>
              ) : null}
            </div>
          </div>
          <div className="text-sm sm:text-right">
            <p className="font-mono font-semibold">{number}</p>
            <p className="text-muted-foreground">{view.issuedAtLabel}</p>
          </div>
        </header>

        <p className="text-xs text-muted-foreground">
          Este documento representa a operação registrada no BusinessOS One. Não
          possui validade fiscal.
        </p>

        {view.branding.documentHeader ? (
          <p className="whitespace-pre-wrap text-sm">{view.branding.documentHeader}</p>
        ) : null}

        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {view.fields.map((field) => (
            <div key={field.label}>
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="font-medium break-all">{field.value}</dd>
            </div>
          ))}
        </dl>

        {view.company.address ? (
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {view.company.address}
          </p>
        ) : null}

        {view.lines.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 font-medium">Descrição</th>
                  <th className="py-2 font-medium">Qtd</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {view.lines.map((line, index) => (
                  <tr key={`${line.description}-${index}`} className="border-b">
                    <td className="py-2">{line.description}</td>
                    <td className="py-2">{line.quantity}</td>
                    <td className="py-2 text-right">{line.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {view.totals.length > 0 ? (
          <div className="ml-auto max-w-xs space-y-1 text-sm">
            {view.totals.map((total) => (
              <p
                key={total.label}
                className={`flex justify-between ${total.emphasize ? "text-base font-semibold" : ""}`}
              >
                <span>{total.label}</span>
                <span>{total.value}</span>
              </p>
            ))}
          </div>
        ) : null}

        {view.notes ? (
          <section>
            <h2 className="text-sm font-semibold">Observações</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm">{view.notes}</p>
          </section>
        ) : null}

        <footer className="space-y-2 border-t pt-4 text-sm">
          {view.branding.documentFooter ? (
            <p className="whitespace-pre-wrap">{view.branding.documentFooter}</p>
          ) : null}
          <p className="whitespace-pre-wrap text-muted-foreground">
            {view.branding.signature}
          </p>
          <p className="text-xs text-muted-foreground">
            {view.company.displayName} · {number} · {view.issuedAtLabel}
          </p>
        </footer>
      </article>
    </div>
  );
}
