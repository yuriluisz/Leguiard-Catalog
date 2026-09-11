import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: "qualivida" } });
  if (!store) {
    console.error("Qualivida store not found!");
    return;
  }

  const result = await prisma.product.updateMany({
    where: {
      storeId: store.id,
      imageUrl: {
        contains: "unsplash.com"
      }
    },
    data: {
      imageUrl: null
    }
  });

  console.log(`Removidas ${result.count} imagens do Unsplash com sucesso!`);
}

main().finally(() => prisma.$disconnect());
