import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

console.log("Iniciando testes do endpoint dinâmico /api/og e resolução de imagem para WhatsApp...\n");

const prisma = new PrismaClient();

async function run() {
  const store = await prisma.store.findUnique({
    where: { slug: "qualivida" }
  });

  assert.ok(store, "Loja QualiVida deve existir no banco de dados");
  console.log("✓ 1. Loja QualiVida encontrada no banco.");

  const settings = store.settings || {};
  const seo = settings.seo || {};
  const ogImage = seo.ogImageUrl || store.logoUrl;

  assert.ok(ogImage, "Loja QualiVida deve possuir imagem de banner ou logo configurada");
  assert.ok(ogImage.startsWith("data:image/"), "Imagem de banner deve estar em formato Data URI Base64");
  console.log("✓ 2. Banner de SEO identificado com sucesso no banco.");

  // Simula a lógica interna do endpoint /api/og
  const match = ogImage.match(/^data:([^;]+);base64,(.+)$/);
  assert.ok(match, "Data URI deve ser decodificável pelo regex");

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  assert.ok(buffer.byteLength > 1000, "Buffer binário decodificado deve ter tamanho válido");
  assert.ok(buffer.byteLength < 500 * 1024, "Buffer deve ter menos de 500KB (ideal para crawler do WhatsApp)");
  console.log(`✓ 3. Decodificação binária bem-sucedida: ${buffer.byteLength} bytes, MIME: ${mimeType}`);

  console.log("\nTodos os testes do endpoint Open Graph passaram com 100% de sucesso!");
}

run()
  .catch((err) => {
    console.error("Erro no teste:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
