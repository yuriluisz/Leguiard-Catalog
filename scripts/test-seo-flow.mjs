import assert from "node:assert/strict";
import { normalizeStoreSettings } from "../src/lib/tenant.ts";
import { storeSchema, storeSettingsSchema } from "../src/lib/validators.ts";

console.log("Iniciando bateria de testes do sistema de SEO...\n");

// 1. Teste de Normalização de Tenant Settings
const rawEmpty = {};
const normEmpty = normalizeStoreSettings(rawEmpty);
assert.equal(typeof normEmpty.seo, "object");
assert.equal(normEmpty.seo.title, "");
assert.equal(normEmpty.seo.description, "");
assert.equal(normEmpty.seo.ogImageUrl, "");
assert.equal(normEmpty.seo.keywords, "");
console.log("✓ 1. Fallback de SEO vazio para lojas legadas verificado com sucesso.");

const rawCustom = {
  seo: {
    title: "  Qualivida Produtos Naturais - Chás & Grãos  ",
    description: "  Os melhores produtos naturais com entrega rápida via WhatsApp.  ",
    ogImageUrl: "https://minhaloja.com/og-banner.jpg",
    keywords: "cha verde, castanhas, psyllium"
  }
};
const normCustom = normalizeStoreSettings(rawCustom);
assert.equal(normCustom.seo.title, "Qualivida Produtos Naturais - Chás & Grãos");
assert.equal(normCustom.seo.description, "Os melhores produtos naturais com entrega rápida via WhatsApp.");
assert.equal(normCustom.seo.ogImageUrl, "https://minhaloja.com/og-banner.jpg");
assert.equal(normCustom.seo.keywords, "cha verde, castanhas, psyllium");
console.log("✓ 2. Sanitização e trim de SEO customizado verificado com sucesso.");

// 2. Teste de Validação Zod do Schema da Loja
const validPayload = {
  slug: "qualivida-teste",
  name: "Qualivida Teste",
  address: "Rua das Flores, 123",
  phone: "5511999999999",
  settings: {
    theme: {
      primaryColor: "#1447e6",
      accentColor: "#1a4eda",
      backgroundColor: "#ffffff"
    },
    checkout: {
      deliveryFee: 10,
      acceptedPayments: ["PIX", "CARTAO"],
      whatsappTemplate: "Olá! Segue meu pedido:"
    },
    social: {
      instagramUrl: "",
      facebookUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      siteUrl: ""
    },
    seo: {
      title: "Loja Teste SEO",
      description: "Descrição de teste para Google",
      ogImageUrl: "https://example.com/banner.png",
      keywords: "teste, seo"
    }
  }
};

const parsed = storeSchema.parse(validPayload);
assert.equal(parsed.settings.seo.title, "Loja Teste SEO");
assert.equal(parsed.settings.seo.description, "Descrição de teste para Google");
assert.equal(parsed.settings.seo.ogImageUrl, "https://example.com/banner.png");
console.log("✓ 3. Validação do schema Zod com campo SEO passou com sucesso.");

// 3. Teste de Validação Zod com payload legado (sem seo)
const legacyPayload = {
  slug: "qualivida-legado",
  name: "Qualivida Legado",
  address: "Rua Antiga, 456",
  phone: "5511988888888"
};
const parsedLegacy = storeSchema.parse(legacyPayload);
assert.equal(parsedLegacy.settings.seo.title, "");
assert.equal(parsedLegacy.settings.seo.description, "");
console.log("✓ 4. Validação do schema Zod com payload legado preencheu defaults com sucesso.");

console.log("\n========================================");
console.log(">>> TODOS OS TESTES DE SEO PASSARAM! <<<");
console.log("========================================");
