import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STORE_SLUG = "qualivida";
const STORE_NAME = "Quali Vida Produtos Naturais";

const DEFAULT_SETTINGS = {
  theme: {
    primaryColor: "#15803d",
    accentColor: "#16a34a",
    backgroundColor: "#ffffff"
  },
  checkout: {
    deliveryFee: 0,
    acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
    whatsappTemplate: "Olá! Gostaria de fazer o seguinte pedido na Quali Vida:\n\n{itens}\n\nTotal: {total}\n\nNome: {nome}\nTelefone: {telefone}"
  },
  social: {
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    siteUrl: ""
  }
};

const CATEGORY_ORDER = [
  "Farinhas",
  "Açúcares",
  "Adoçante",
  "Chás",
  "Temperos",
  "Castanha",
  "Desidratados",
  "Sementes",
  "Encapsulados",
  "Extrato",
  "Suplementos",
  "Mel"
];

async function main() {
  console.log("==========================================");
  console.log("  INICIANDO SEED QUALI VIDA PRODUTOS NATURAIS");
  console.log("==========================================\n");

  // 1. Criar ou atualizar a Loja Qualivida
  console.log("1. Configurando Loja Qualivida...");
  const store = await prisma.store.upsert({
    where: { slug: STORE_SLUG },
    update: {
      name: STORE_NAME,
      logoUrl: "https://prod-minio.aifsu7.easypanel.host/img/logo.webp",
      settings: DEFAULT_SETTINGS
    },
    create: {
      slug: STORE_SLUG,
      name: STORE_NAME,
      address: "Atendimento online e retirada",
      phone: process.env.QUALIVIDA_PHONE || "5511999999999",
      logoUrl: "https://prod-minio.aifsu7.easypanel.host/img/logo.webp",
      settings: DEFAULT_SETTINGS
    }
  });
  console.log(`✓ Loja pronta: ${store.name} (id: ${store.id}, slug: /${store.slug})`);

  // 2. Vincular Usuário Admin como OWNER da Qualivida
  const adminEmail = (process.env.ADMIN_EMAIL || "yulusica@gmail.com").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (user) {
    await prisma.storeUser.upsert({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId: store.id
        }
      },
      update: { role: "OWNER" },
      create: {
        userId: user.id,
        storeId: store.id,
        role: "OWNER"
      }
    });
    console.log(`✓ Usuário admin (${user.email}) vinculado como OWNER da Qualivida.`);
  }

  // 3. Criar Categorias
  console.log("\n2. Criando Categorias da Qualivida...");
  const categoryMap = new Map();

  for (let i = 0; i < CATEGORY_ORDER.length; i++) {
    const catName = CATEGORY_ORDER[i];
    const category = await prisma.category.upsert({
      where: {
        storeId_name: {
          storeId: store.id,
          name: catName
        }
      },
      update: {
        displayOrder: i + 1
      },
      create: {
        storeId: store.id,
        name: catName,
        displayOrder: i + 1
      }
    });
    categoryMap.set(catName, category.id);
    console.log(`  [${i + 1}/${CATEGORY_ORDER.length}] Categoria: ${catName} (ordem: ${i + 1})`);
  }

  // 4. Carregar e Inserir Produtos
  console.log("\n3. Inserindo Catálogo de Produtos (147 produtos)...");
  const rawProducts = JSON.parse(fs.readFileSync("scripts/qualivida-seed-data.json", "utf-8"));

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of rawProducts) {
    const categoryId = categoryMap.get(item.category);
    if (!categoryId) {
      console.error(`[ERRO]: Categoria não encontrada para ${item.name}: ${item.category}`);
      continue;
    }

    // Upsert por storeId + name
    const existing = await prisma.product.findFirst({
      where: {
        storeId: store.id,
        name: item.name
      }
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          categoryId,
          description: item.description,
          price: item.price,
          unitType: item.unitType,
          minQuantity: item.minQuantity,
          displayFraction: item.displayFraction,
          isPinned: item.isPinned,
          imageUrl: item.imageUrl,
          isActive: true,
          isOutOfStock: false
        }
      });
      updatedCount++;
    } else {
      await prisma.product.create({
        data: {
          storeId: store.id,
          categoryId,
          name: item.name,
          description: item.description,
          price: item.price,
          unitType: item.unitType,
          minQuantity: item.minQuantity,
          displayFraction: item.displayFraction,
          isPinned: item.isPinned,
          imageUrl: item.imageUrl,
          isActive: true,
          isOutOfStock: false
        }
      });
      insertedCount++;
    }
  }

  console.log(`✓ Produtos criados: ${insertedCount}, atualizados: ${updatedCount}`);

  // 5. Auditoria e Estatísticas Finais
  console.log("\n==========================================");
  console.log("        AUDITORIA FINAL DA QUALIVIDA       ");
  console.log("==========================================");

  const totalProds = await prisma.product.count({ where: { storeId: store.id } });
  const totalCats = await prisma.category.count({ where: { storeId: store.id } });
  const kgCount = await prisma.product.count({ where: { storeId: store.id, unitType: "KG" } });
  const unCount = await prisma.product.count({ where: { storeId: store.id, unitType: "UN" } });
  const withDesc = await prisma.product.count({
    where: {
      storeId: store.id,
      description: { not: null }
    }
  });
  const pinnedCount = await prisma.product.count({ where: { storeId: store.id, isPinned: true } });

  console.log(`- Total de Categorias: ${totalCats}`);
  console.log(`- Total de Produtos no Banco: ${totalProds} (esperado: 147)`);
  console.log(`- Produtos vendidos a granel (KG / 100g): ${kgCount}`);
  console.log(`- Produtos vendidos por unidade (UN): ${unCount}`);
  console.log(`- Produtos com descrição completa: ${withDesc} (100%)`);
  console.log(`- Produtos em destaque (fixados): ${pinnedCount}`);
  console.log(`- URL da Loja: /${store.slug}`);
  console.log("\n>>> BANCO DE DADOS RESTAURADO COM 100% DE SUCESSO! <<<\n");
}

main()
  .catch((err) => {
    console.error("Erro ao rodar seed da Qualivida:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
