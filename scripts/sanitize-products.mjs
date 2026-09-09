import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Verificando produtos UN com decimais...");
  const unProducts = await prisma.product.findMany({
    where: { unitType: "UN" }
  });

  let updatedCount = 0;
  for (const product of unProducts) {
    const currentMin = Number(product.minQuantity);
    const roundedMin = Math.max(1, Math.round(currentMin));

    if (currentMin !== roundedMin) {
      console.log(`Atualizando produto ${product.name} (${product.id}): ${currentMin} -> ${roundedMin}`);
      await prisma.product.update({
        where: { id: product.id },
        data: { minQuantity: roundedMin }
      });
      updatedCount++;
    }
  }

  console.log(`Sanitização concluída. ${updatedCount} produto(s) atualizado(s).`);
}

main()
  .catch((e) => {
    console.error("Erro na sanitização:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
