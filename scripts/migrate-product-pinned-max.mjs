import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Aplicando alter table seguro na tabela products...");
  await prisma.$executeRawUnsafe(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN DEFAULT false;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS "maxQuantity" DECIMAL(10, 3);
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "products_storeId_isPinned_isActive_idx" 
    ON products("storeId", "isPinned", "isActive");
  `);

  console.log("Colunas isPinned e maxQuantity adicionadas com sucesso sem perda de dados!");
}

main()
  .catch((e) => {
    console.error("Erro na migração:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
