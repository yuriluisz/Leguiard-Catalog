import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = (process.env.ADMIN_EMAIL || "admin@leguiard.local").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "123456";
const storeSlug = (process.env.ADMIN_STORE_SLUG || "minha-loja").trim().toLowerCase();

const defaultSettings = {
  theme: {
    primaryColor: "#1447e6",
    accentColor: "#1a4eda",
    backgroundColor: "#ffffff"
  },
  checkout: {
    deliveryFee: 0,
    acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
    whatsappTemplate: "Ola! Segue meu pedido:"
  },
  social: {
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    siteUrl: ""
  }
};

async function run() {
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: {
      email
    },
    update: {
      passwordHash
    },
    create: {
      email,
      name: "Administrador",
      passwordHash
    }
  });

  const store = await prisma.store.upsert({
    where: {
      slug: storeSlug
    },
    update: {},
    create: {
      slug: storeSlug,
      name: "Minha Loja",
      address: "Endereco para retirada",
      phone: "5500000000000",
      settings: defaultSettings
    }
  });

  await prisma.storeUser.upsert({
    where: {
      userId_storeId: {
        userId: user.id,
        storeId: store.id
      }
    },
    update: {
      role: "OWNER"
    },
    create: {
      userId: user.id,
      storeId: store.id,
      role: "OWNER"
    }
  });

  console.log("Seed concluida com sucesso:");
  console.log(`- Usuario: ${email}`);
  console.log(`- Senha: ${password}`);
  console.log(`- Loja: /${store.slug}`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
