import { BrandHomeLink } from "@/shared/brand/brand-logo";

export function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 py-10">
      <BrandHomeLink className="mb-8" />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
