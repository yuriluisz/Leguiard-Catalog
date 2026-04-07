-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_users" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_users_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "stores" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "stores" ADD COLUMN "slug" TEXT;

-- Ensure at least one store exists
INSERT INTO "stores" ("id", "slug", "name", "address", "phone", "logoUrl", "whatsappTemplate", "settings", "updatedAt", "createdAt")
SELECT
    '00000000-0000-0000-0000-000000000001'::uuid,
    'minha-loja',
    'Minha Loja',
    'Endereco para retirada',
    '5500000000000',
    NULL,
    'Ola! Segue meu pedido:',
    jsonb_build_object(
      'theme', jsonb_build_object('primaryColor', '#bc5a2b', 'accentColor', '#4b6a39', 'backgroundColor', '#f4f2eb'),
      'checkout', jsonb_build_object(
        'deliveryFee', 0,
        'acceptedPayments', jsonb_build_array('PIX', 'CARTAO', 'DINHEIRO'),
        'whatsappTemplate', 'Ola! Segue meu pedido:'
      )
    ),
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "stores");

-- Normalize new store columns
UPDATE "stores"
SET "slug" = CONCAT('loja-', SUBSTRING("id"::text, 1, 8))
WHERE "slug" IS NULL OR "slug" = '';

UPDATE "stores"
SET "settings" = jsonb_build_object(
  'theme', jsonb_build_object('primaryColor', '#bc5a2b', 'accentColor', '#4b6a39', 'backgroundColor', '#f4f2eb'),
  'checkout', jsonb_build_object(
    'deliveryFee', 0,
    'acceptedPayments', jsonb_build_array('PIX', 'CARTAO', 'DINHEIRO'),
    'whatsappTemplate', COALESCE("whatsappTemplate", 'Ola! Segue meu pedido:')
  )
)
WHERE "settings" = '{}'::jsonb OR "settings" IS NULL;

ALTER TABLE "stores" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "storeId" UUID;
ALTER TABLE "products" ADD COLUMN "storeId" UUID;
ALTER TABLE "leads" ADD COLUMN "storeId" UUID;

-- Backfill existing data into first store
WITH "default_store" AS (
  SELECT "id" FROM "stores" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "categories"
SET "storeId" = (SELECT "id" FROM "default_store")
WHERE "storeId" IS NULL;

WITH "default_store" AS (
  SELECT "id" FROM "stores" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "products"
SET "storeId" = (SELECT "id" FROM "default_store")
WHERE "storeId" IS NULL;

WITH "default_store" AS (
  SELECT "id" FROM "stores" ORDER BY "createdAt" ASC LIMIT 1
)
UPDATE "leads"
SET "storeId" = (SELECT "id" FROM "default_store")
WHERE "storeId" IS NULL;

ALTER TABLE "categories" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "storeId" SET NOT NULL;
ALTER TABLE "leads" ALTER COLUMN "storeId" SET NOT NULL;

-- Drop old indexes
DROP INDEX IF EXISTS "categories_displayOrder_idx";
DROP INDEX IF EXISTS "products_categoryId_idx";
DROP INDEX IF EXISTS "products_isActive_isOutOfStock_idx";
DROP INDEX IF EXISTS "products_name_idx";
DROP INDEX IF EXISTS "leads_createdAt_idx";
DROP INDEX IF EXISTS "leads_phone_idx";

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");
CREATE UNIQUE INDEX "store_users_userId_storeId_key" ON "store_users"("userId", "storeId");
CREATE INDEX "store_users_storeId_idx" ON "store_users"("storeId");
CREATE INDEX "categories_storeId_displayOrder_idx" ON "categories"("storeId", "displayOrder");
CREATE UNIQUE INDEX "categories_storeId_name_key" ON "categories"("storeId", "name");
CREATE INDEX "products_storeId_categoryId_idx" ON "products"("storeId", "categoryId");
CREATE INDEX "products_storeId_isActive_isOutOfStock_idx" ON "products"("storeId", "isActive", "isOutOfStock");
CREATE INDEX "products_storeId_name_idx" ON "products"("storeId", "name");
CREATE INDEX "leads_storeId_createdAt_idx" ON "leads"("storeId", "createdAt");
CREATE INDEX "leads_storeId_phone_idx" ON "leads"("storeId", "phone");

-- AddForeignKey
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;