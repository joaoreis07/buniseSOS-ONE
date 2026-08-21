export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 px-6 py-16">
        <p className="text-sm font-medium tracking-[0.2em] text-emerald-400 uppercase">
          BusinessOS One
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Sua empresa inteira em um só lugar.
        </h1>
        <p className="max-w-xl text-lg text-zinc-400">
          Fundação do novo produto em andamento. CRM, vendas, estoque, financeiro,
          DRE e e-commerce nascerão neste repositório — independente do BusinessOS
          Finance.
        </p>
        <ul className="space-y-2 text-sm text-zinc-500">
          <li>FASE 0 — repositório e ambiente</li>
          <li>FASE 1 — auditoria do Finance (somente leitura)</li>
          <li>FASE 2 — fundação técnica</li>
        </ul>
      </div>
    </main>
  );
}
