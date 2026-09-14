import { createHash, randomBytes } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";

export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type StoredImageKind = "jpeg" | "png";

function storageRoot() {
  const configured = process.env.STORAGE_ROOT?.trim();
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured);
  }
  return path.join(process.cwd(), "storage", "tenants");
}

function assertSafeCompanyId(companyId: string) {
  if (!/^[a-z0-9]{20,32}$/i.test(companyId)) {
    throw new Error("Empresa inválida para armazenamento");
  }
}

function looksLike(buffer: Buffer, magic: Buffer) {
  return buffer.length >= magic.length && buffer.subarray(0, magic.length).equals(magic);
}

export function detectImageKind(buffer: Buffer): StoredImageKind | null {
  if (looksLike(buffer, JPEG)) return "jpeg";
  if (looksLike(buffer, PNG)) return "png";
  return null;
}

export function validateLogoUpload(buffer: Buffer) {
  if (!buffer.length) {
    throw new Error("Arquivo de logo vazio");
  }
  if (buffer.length > LOGO_MAX_BYTES) {
    throw new Error("Logo deve ter no máximo 2 MB");
  }
  const kind = detectImageKind(buffer);
  if (!kind) {
    throw new Error("Envie uma imagem JPEG ou PNG");
  }
  return kind;
}

function relativeLogoPath(companyId: string, filename: string) {
  return path.posix.join(companyId, "logo", filename);
}

export function resolveTenantFile(companyId: string, relativePath: string) {
  assertSafeCompanyId(companyId);
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized.startsWith(`${companyId}/`) ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new Error("Caminho de arquivo inválido");
  }
  const absolute = path.resolve(storageRoot(), ...normalized.split("/"));
  const root = path.resolve(storageRoot(), companyId);
  if (absolute !== root && !absolute.startsWith(`${root}${path.sep}`)) {
    throw new Error("Caminho de arquivo inválido");
  }
  return absolute;
}

export async function saveCompanyLogo(params: {
  companyId: string;
  buffer: Buffer;
}) {
  const kind = validateLogoUpload(params.buffer);
  const filename = `${randomBytes(12).toString("hex")}.${kind === "jpeg" ? "jpg" : "png"}`;
  const relativePath = relativeLogoPath(params.companyId, filename);
  const absolute = resolveTenantFile(params.companyId, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, params.buffer, { flag: "wx" });
  return {
    relativePath,
    kind,
    checksum: createHash("sha256").update(params.buffer).digest("hex"),
  };
}

export async function readCompanyLogo(params: {
  companyId: string;
  relativePath: string;
}) {
  const absolute = resolveTenantFile(params.companyId, params.relativePath);
  const buffer = await readFile(absolute);
  const kind = detectImageKind(buffer);
  if (!kind) throw new Error("Arquivo de logo inválido");
  return { buffer, kind };
}

export async function deleteCompanyFile(params: {
  companyId: string;
  relativePath: string | null | undefined;
}) {
  if (!params.relativePath) return;
  try {
    await unlink(resolveTenantFile(params.companyId, params.relativePath));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw error;
  }
}
