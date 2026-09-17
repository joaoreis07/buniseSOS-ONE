import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/utilities/cn";

const WORDMARK = {
  src: "/brand/wordmark.jpg",
  width: 1024,
  height: 341,
  alt: "BusinessOS One — Gestão simples. Resultados reais.",
} as const;

const MARK = {
  src: "/brand/mark.jpg",
  width: 1024,
  height: 1024,
  alt: "BusinessOS One",
} as const;

type BrandWordmarkProps = {
  className?: string;
  priority?: boolean;
};

export function BrandWordmark({ className, priority = false }: BrandWordmarkProps) {
  return (
    <Image
      src={WORDMARK.src}
      alt={WORDMARK.alt}
      width={WORDMARK.width}
      height={WORDMARK.height}
      priority={priority}
      className={cn("h-auto w-full", className)}
    />
  );
}

type BrandMarkProps = {
  className?: string;
  size?: number;
  priority?: boolean;
};

export function BrandMark({ className, size = 40, priority = false }: BrandMarkProps) {
  return (
    <Image
      src={MARK.src}
      alt={MARK.alt}
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-lg object-cover", className)}
    />
  );
}

export function BrandHomeLink({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("block w-full max-w-md", className)}>
      <BrandWordmark priority />
    </Link>
  );
}
