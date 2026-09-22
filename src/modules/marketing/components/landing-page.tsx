"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  Menu,
  MessageSquare,
  Package,
  ShieldCheck,
  ShoppingCart,
  UserCog,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import { BrandMark } from "@/shared/brand/brand-logo";
import {
  FAQS,
  FEATURE_CARDS,
  LANDING_NAV,
  PLAN_FEATURES,
  PRODUCT_MODULES,
  SECURITY_ITEMS,
} from "@/modules/marketing/landing-data";
import { LandingMockups } from "@/modules/marketing/components/landing-mockups";
import { cn } from "@/shared/utilities/cn";

const FEATURE_ICONS = [
  Users,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Package,
  FileSpreadsheet,
  UserCog,
  MessageSquare,
] as const;

function CtaStart({
  className,
  label = "Começar agora",
  onClick,
}: {
  className?: string;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href="/register"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full bg-[#3B82F6] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.28)] transition hover:bg-[#60A5FA] hover:shadow-[0_0_32px_rgba(59,130,246,0.45)]",
        className,
      )}
    >
      {label}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}

function CtaDemo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/demo"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10",
        className,
      )}
    >
      Ver demonstração
    </Link>
  );
}

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="landing relative min-h-screen">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-[#0B0F19]"
      >
        Ir para o conteúdo
      </a>
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#1E3A8A]/20 blur-[120px]" />
        <div className="absolute top-[30%] right-[-10%] h-[40%] w-[40%] rounded-full bg-[#3B82F6]/10 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[40%] w-[60%] rounded-full bg-[#22D3EE]/5 blur-[120px]" />
      </div>

      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b border-white/5 transition-all duration-300",
          scrolled ? "bg-[#0B0F19]/85 py-3 backdrop-blur-md" : "bg-transparent py-5",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="relative z-50 flex items-center gap-2" onClick={closeMobile}>
            <BrandMark size={36} className="size-9 rounded-none" priority />
            <span className="text-lg font-semibold tracking-tight">BusinessOS One</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Seções">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-300 transition hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link href="/login" className="text-sm font-medium text-white hover:text-[#60A5FA]">
              Entrar
            </Link>
            <CtaStart className="px-5 py-2.5 text-sm" />
          </div>

          <button
            type="button"
            className="relative z-50 rounded-md p-2 text-white lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-nav"
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="landing-mobile-nav"
          className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-[#0B0F19] px-6 pt-6 pb-10 lg:hidden"
        >
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2" onClick={closeMobile}>
              <BrandMark size={36} className="size-9 rounded-none" />
              <span className="text-lg font-semibold tracking-tight">BusinessOS One</span>
            </Link>
            <button
              type="button"
              className="rounded-md p-2 text-white"
              aria-label="Fechar menu"
              onClick={closeMobile}
            >
              <X className="size-6" />
            </button>
          </div>
          <nav className="flex flex-col gap-5 text-center" aria-label="Menu mobile">
            {LANDING_NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-xl font-medium text-white"
                onClick={closeMobile}
              >
                {item.label}
              </a>
            ))}
            <div className="my-2 h-px w-full bg-white/10" />
            <Link href="/login" className="text-xl font-medium text-white" onClick={closeMobile}>
              Entrar
            </Link>
            <CtaDemo className="mt-1" onClick={closeMobile} />
            <CtaStart className="mt-1 py-4 text-base" onClick={closeMobile} />
          </nav>
        </div>
      ) : null}

      <main id="conteudo" className="relative z-10 pt-28 pb-16 sm:pt-32 lg:pt-40">
        <section className="landing-fade mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wider text-[#60A5FA] uppercase">
              <BrandMark size={20} className="size-5 rounded-none" priority />
              BusinessOS One
            </p>
            <h1 className="mb-6 text-4xl leading-[1.1] font-bold sm:text-5xl lg:text-6xl">
              Tudo o que sua empresa precisa.
              <br />
              <span className="landing-gradient-text landing-glow-text">Em um só lugar.</span>
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-300">
              CRM, vendas, estoque, financeiro, compras e relatórios em uma única
              plataforma de gestão.
            </p>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <CtaStart />
              <CtaDemo />
            </div>
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2 className="size-4 text-[#60A5FA]" aria-hidden />
              Sem complicação. Gestão completa para o seu negócio.
            </p>
            <p className="mt-4 text-sm">
              <Link href="/login" className="text-slate-300 underline-offset-4 hover:text-white hover:underline">
                Já tem conta? Entrar
              </Link>
            </p>
          </div>
          <LandingMockups.Hero />
        </section>

        <section id="produto" className="mx-auto mt-28 scroll-mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Uma plataforma para cuidar da sua operação inteira.
            </h2>
            <p className="text-lg text-slate-300">
              O One conecta os módulos do dia a dia da empresa, sem prometer o que
              ainda não existe.
            </p>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-4">
            {PRODUCT_MODULES.map((item) => (
              <li
                key={item}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200"
              >
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Sua empresa não precisa de vários sistemas.
            </h2>
            <p className="text-lg text-slate-300">
              Planilhas para uma coisa. Aplicativos para outra. Anotações
              espalhadas. Informações que não conversam.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <div className="mb-10 flex flex-wrap justify-center gap-4 opacity-80">
              <span className="landing-card rounded-xl px-5 py-3 text-sm">Planilha de vendas</span>
              <span className="landing-card rounded-xl px-5 py-3 text-sm">WhatsApp avulso</span>
              <span className="landing-card rounded-xl px-5 py-3 text-sm">Bloco de notas do estoque</span>
              <span className="landing-card rounded-xl px-5 py-3 text-sm">Financeiro separado</span>
            </div>
            <div className="h-16 w-px bg-gradient-to-b from-white/20 to-[#3B82F6]" aria-hidden />
            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[#3B82F6]/40 px-6 py-4">
              <BrandMark size={40} className="size-10 rounded-none" />
              <span className="text-2xl font-semibold">BusinessOS One</span>
            </div>
          </div>
        </section>

        <section id="recursos" className="mx-auto mt-28 scroll-mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Uma plataforma. Toda a operação.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((card, index) => {
              const Icon = FEATURE_ICONS[index];
              return (
                <article
                  key={card.title}
                  className="landing-card group rounded-2xl p-6 transition hover:border-[#3B82F6]/50 hover:bg-white/[0.04]"
                >
                  <div className="mb-5 flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#0B0F19] text-[#60A5FA] transition group-hover:bg-[#3B82F6] group-hover:text-white">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Sua empresa pode ser mais simples.</h2>
          <p className="mb-8 text-lg text-slate-300">
            Tenha uma visão completa da sua operação em um único sistema.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <CtaStart />
            <CtaDemo />
          </div>
        </section>

        <LandingMockups.Product />

        <section id="como-funciona" className="mx-auto mt-28 scroll-mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Comece em poucos minutos.</h2>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            <li className="flex flex-col items-center text-center">
              <span className="landing-card mb-5 flex size-20 items-center justify-center rounded-full border border-[#3B82F6]/30 text-2xl font-bold">
                01
              </span>
              <h3 className="mb-2 text-xl font-semibold">Crie sua conta</h3>
              <p className="mb-4 text-slate-300">Cadastro simples. Você entra como administrador da empresa.</p>
              <CtaStart label="Criar conta" className="px-5 py-2.5" />
            </li>
            <li className="flex flex-col items-center text-center">
              <span className="landing-card mb-5 flex size-20 items-center justify-center rounded-full border border-[#3B82F6]/30 text-2xl font-bold">
                02
              </span>
              <h3 className="mb-2 text-xl font-semibold">Configure sua empresa</h3>
              <p className="text-slate-300">
                Depois do cadastro, ajuste dados, branding, equipe e preferências nas
                configurações.
              </p>
            </li>
            <li className="flex flex-col items-center text-center">
              <span className="landing-card mb-5 flex size-20 items-center justify-center rounded-full border border-[#3B82F6]/30 text-2xl font-bold">
                03
              </span>
              <h3 className="mb-2 text-xl font-semibold">Comece a operar</h3>
              <p className="text-slate-300">
                Use CRM, vendas, estoque, financeiro, compras, relatórios e
                comunicações.
              </p>
            </li>
          </ol>
        </section>

        <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="landing-glass relative overflow-hidden rounded-3xl p-8 md:p-12">
            <ShieldCheck className="pointer-events-none absolute top-6 right-6 size-28 text-white/10 md:size-40" aria-hidden />
            <h2 className="relative z-10 mb-8 text-3xl font-bold sm:text-4xl">Seus dados, protegidos.</h2>
            <div className="relative z-10 grid max-w-3xl gap-5 md:grid-cols-2">
              {SECURITY_ITEMS.map((item) => (
                <div key={item.title}>
                  <p className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="size-5 text-emerald-400" aria-hidden />
                    {item.title}
                  </p>
                  <p className="mt-1 pl-7 text-sm text-slate-300">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="planos" className="mx-auto mt-28 scroll-mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold sm:text-4xl lg:text-5xl">Um plano. Tudo incluso.</h2>
            <p className="text-lg text-slate-300">Assinatura mensal do BusinessOS One.</p>
          </div>
          <div className="mx-auto max-w-lg">
            <div className="landing-glass rounded-3xl border border-[#3B82F6]/40 p-8 shadow-[0_0_40px_-12px_rgba(59,130,246,0.35)] md:p-10">
              <h3 className="mb-1 text-2xl font-bold">BusinessOS One</h3>
              <p className="mb-6 text-slate-300">Acesso aos módulos atuais do produto.</p>
              <p className="mb-8">
                <span className="text-5xl font-bold">R$ 197</span>
                <span className="text-slate-400">/mês</span>
              </p>
              <CtaStart className="mb-3 w-full rounded-xl bg-white py-4 text-[#0B0F19] shadow-none hover:bg-slate-100 hover:text-[#0B0F19]" />
              <CtaDemo className="mb-4 w-full" />
              <p className="mb-8 text-center text-sm text-slate-400">
                Pagamento e assinatura online. O valor é cobrado depois que você inicia
                a assinatura nas configurações da empresa — não nesta página.
              </p>
              <ul className="space-y-3">
                {PLAN_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="size-4 shrink-0 text-[#60A5FA]" aria-hidden />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto mt-28 scroll-mt-24 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Perguntas frequentes</h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQS.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.question} className="landing-card overflow-hidden rounded-xl">
                  <h3>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-medium"
                      aria-expanded={open}
                      onClick={() => setOpenFaq(open ? null : index)}
                    >
                      {faq.question}
                      <ChevronRight
                        className={cn("size-5 shrink-0 text-slate-400 transition", open && "rotate-90")}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  {open ? (
                    <div className="px-5 pb-5 text-sm leading-relaxed text-slate-300">
                      {faq.question === "Posso conhecer o sistema antes?" ? (
                        <p>
                          {faq.answer}{" "}
                          <Link href="/demo" className="text-[#60A5FA] underline-offset-4 hover:underline">
                            Acesse a demonstração
                          </Link>
                          .
                        </p>
                      ) : (
                        <p>{faq.answer}</p>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto mt-28 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/30 bg-[#111827] px-8 py-14 text-center md:px-16 md:py-20">
            <div className="pointer-events-none absolute inset-0 bg-[#3B82F6]/15 blur-[90px]" aria-hidden />
            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="landing-glow-text mb-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Pronto para ter tudo sob controle?
              </h2>
              <p className="mb-8 text-lg text-slate-200">
                Conheça o BusinessOS One e organize sua empresa em um só lugar.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CtaStart className="px-10 py-4 text-base" />
                <CtaDemo />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/10 bg-[#0B0F19] pt-16 pb-8">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          <div className="sm:col-span-2">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <BrandMark size={32} className="size-8 rounded-none" />
              <span className="text-lg font-semibold">BusinessOS One</span>
            </Link>
            <p className="max-w-sm text-sm text-slate-400">
              Gestão simples. Resultados reais.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Produto</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#recursos" className="hover:text-[#60A5FA]">
                  Recursos
                </a>
              </li>
              <li>
                <a href="#planos" className="hover:text-[#60A5FA]">
                  Planos
                </a>
              </li>
              <li>
                <Link href="/demonstracao" className="hover:text-[#60A5FA]">
                  Demonstração
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Acesso</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/login" className="hover:text-[#60A5FA]">
                  Entrar
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-[#60A5FA]">
                  Criar conta
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white">Informações</p>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a href="#faq" className="hover:text-[#60A5FA]">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-3 border-t border-white/10 px-4 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} BusinessOS One.</p>
        </div>
      </footer>
    </div>
  );
}
