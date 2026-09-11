import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.findUnique({ where: { slug: "qualivida" } });

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    select: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      category: { select: { name: true } }
    },
    orderBy: { name: "asc" }
  });

  const total = products.length;
  const withoutDesc = products.filter(p => !p.description || p.description.trim().length === 0);
  const withDesc = products.filter(p => p.description && p.description.trim().length > 0);
  const unsplashImgs = products.filter(p => p.imageUrl && p.imageUrl.includes("unsplash"));
  const remainingImgs = products.filter(p => !!p.imageUrl);

  console.log("=== AUDITORIA FINAL QUALIVIDA ===");
  console.log(`Total de produtos: ${total}`);
  console.log(`Produtos com descrição: ${withDesc.length} (esperado: ${total})`);
  console.log(`Produtos sem descrição: ${withoutDesc.length} (esperado: 0)`);
  console.log(`Imagens Unsplash: ${unsplashImgs.length} (esperado: 0)`);
  console.log(`Imagens restantes (originais autênticas): ${remainingImgs.length}`);

  // Check line lengths
  let maxLines = 0;
  let overThreeLines = 0;
  for (const p of withDesc) {
    const lines = p.description.split("\n").filter(l => l.trim().length > 0);
    if (lines.length > maxLines) maxLines = lines.length;
    if (lines.length > 3) overThreeLines++;
  }
  console.log(`Máximo de linhas encontrado: ${maxLines}`);
  console.log(`Descrições com mais de 3 linhas: ${overThreeLines} (esperado: 0)`);

  if (withoutDesc.length === 0 && unsplashImgs.length === 0 && overThreeLines === 0) {
    console.log("\n>>> AUDITORIA APROVADA COM 100% DE SUCESSO! <<<");
  } else {
    console.log("\n>>> AUDITORIA FALHOU! <<<");
  }
}

main().finally(() => prisma.$disconnect());
