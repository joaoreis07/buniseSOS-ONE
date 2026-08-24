-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN', 'LOSS');

-- CreateTable
CREATE TABLE "public"."Inventory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."InventoryMovement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "public"."Inventory"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_companyId_productId_key" ON "public"."Inventory"("companyId", "productId");

-- CreateIndex
CREATE INDEX "Inventory_companyId_idx" ON "public"."Inventory"("companyId");

-- CreateIndex
CREATE INDEX "Inventory_companyId_quantity_idx" ON "public"."Inventory"("companyId", "quantity");

-- CreateIndex
CREATE INDEX "InventoryMovement_companyId_productId_createdAt_idx" ON "public"."InventoryMovement"("companyId", "productId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_companyId_createdAt_idx" ON "public"."InventoryMovement"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_idx" ON "public"."InventoryMovement"("productId");

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."InventoryMovement" ADD CONSTRAINT "InventoryMovement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
