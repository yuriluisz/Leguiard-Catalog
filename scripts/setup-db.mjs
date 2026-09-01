import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DDL_STATEMENTS = [
  // 1. Enum
  `DO $$ BEGIN
    CREATE TYPE "UnitType" AS ENUM ('UN', 'KG');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`,

  // 2. Users
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");`,

  // 3. Stores
  `CREATE TABLE IF NOT EXISTS "stores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "logoUrl" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "stores_slug_key" ON "stores"("slug");`,

  // 4. Store Users
  `CREATE TABLE IF NOT EXISTS "store_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "storeId" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "store_users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "store_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "store_users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "store_users_userId_storeId_key" ON "store_users"("userId", "storeId");`,
  `CREATE INDEX IF NOT EXISTS "store_users_storeId_idx" ON "store_users"("storeId");`,

  // 5. Categories
  `CREATE TABLE IF NOT EXISTS "categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "categories_storeId_displayOrder_idx" ON "categories"("storeId", "displayOrder");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "categories_storeId_name_key" ON "categories"("storeId", "name");`,

  // 6. Products
  `CREATE TABLE IF NOT EXISTS "products" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storeId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "displayFraction" INTEGER,
    "minQuantity" DECIMAL(10,3) NOT NULL DEFAULT 1,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isOutOfStock" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "products_storeId_categoryId_idx" ON "products"("storeId", "categoryId");`,
  `CREATE INDEX IF NOT EXISTS "products_storeId_isActive_isOutOfStock_idx" ON "products"("storeId", "isActive", "isOutOfStock");`,
  `CREATE INDEX IF NOT EXISTS "products_storeId_name_idx" ON "products"("storeId", "name");`,

  // 7. Leads
  `CREATE TABLE IF NOT EXISTS "leads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "storeId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "leads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "leads_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE
  );`,
  `CREATE INDEX IF NOT EXISTS "leads_storeId_createdAt_idx" ON "leads"("storeId", "createdAt");`,
  `CREATE INDEX IF NOT EXISTS "leads_storeId_phone_idx" ON "leads"("storeId", "phone");`
];

async function main() {
  console.log("Criando tabelas e índices no PostgreSQL...");
  for (let i = 0; i < DDL_STATEMENTS.length; i++) {
    const stmt = DDL_STATEMENTS[i];
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log("Estrutura do banco criada com sucesso!");
}

main()
  .catch((err) => {
    console.error("Erro ao estruturar banco:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
