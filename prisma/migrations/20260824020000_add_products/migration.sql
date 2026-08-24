-- CreateEnum
CREATE TYPE "public"."ProductType" AS ENUM ('PRODUCT', 'SERVICE');

-- CreateEnum
CREATE TYPE "public"."ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "description" TEXT,
    "type" "public"."ProductType" NOT NULL DEFAULT 'PRODUCT',
    "categoryId" TEXT,
    "costPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "salePrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "public"."ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_deletedAt_idx" ON "public"."ProductCategory"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_name_idx" ON "public"."ProductCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "ProductCategory_companyId_createdAt_idx" ON "public"."ProductCategory"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_companyId_name_active_key" ON "public"."ProductCategory"("companyId", "name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Product_companyId_deletedAt_idx" ON "public"."Product"("companyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_companyId_name_idx" ON "public"."Product"("companyId", "name");

-- CreateIndex
CREATE INDEX "Product_companyId_sku_idx" ON "public"."Product"("companyId", "sku");

-- CreateIndex
CREATE INDEX "Product_companyId_barcode_idx" ON "public"."Product"("companyId", "barcode");

-- CreateIndex
CREATE INDEX "Product_companyId_type_deletedAt_idx" ON "public"."Product"("companyId", "type", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_companyId_status_deletedAt_idx" ON "public"."Product"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_companyId_categoryId_deletedAt_idx" ON "public"."Product"("companyId", "categoryId", "deletedAt");

-- CreateIndex
CREATE INDEX "Product_companyId_createdAt_idx" ON "public"."Product"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_sku_active_key" ON "public"."Product"("companyId", "sku") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_barcode_active_key" ON "public"."Product"("companyId", "barcode") WHERE "deletedAt" IS NULL AND "barcode" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
