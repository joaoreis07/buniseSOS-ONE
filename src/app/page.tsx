import Link from "next/link";
import { BrandWordmark } from "@/shared/brand/brand-logo";
import { Button } from "@/shared/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <BrandWordmark priority className="max-w-xl" />
        <h1 className="sr-only">BusinessOS One</h1>
        <p className="max-w-xl text-lg text-zinc-400">
          Sua empresa inteira em um só lugar. CRM, vendas, estoque, financeiro e
          operação no mesmo sistema.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-blue-600 text-white hover:bg-blue-500">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-900 hover:text-white"
          >
            <Link href="/register">Criar conta</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
