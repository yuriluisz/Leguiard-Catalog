import assert from "node:assert/strict";
import fs from "node:fs";
import { searchProducts, normalizeSearchText, levenshteinDistance, toPhonetic } from "../src/lib/search.ts";

const catalog = JSON.parse(fs.readFileSync("scripts/qualivida-seed-data.json", "utf-8"));
console.log(`Carregados ${catalog.length} produtos do catálogo para teste.\n`);

// 1. Testes de Levenshtein e Fonética
assert.equal(levenshteinDistance("espinera", "espinheira", 2), 2);
assert.equal(levenshteinDistance("chimichuri", "chimichurri", 2), 1);
assert.equal(levenshteinDistance("ginkgo", "ginko", 2), 1);
assert.equal(levenshteinDistance(toPhonetic("psilio"), toPhonetic("psyllium"), 2), 2);
assert.equal(toPhonetic("xilitol"), toPhonetic("zilitol"));
console.log("✓ Testes de distância de Levenshtein e fonética passaram.");

// 2. Testes de Normalização
assert.equal(normalizeSearchText("Açafrão Cúrcuma!"), "acafrao curcuma");
assert.equal(normalizeSearchText("Chá de Canela & Cravo"), "cha de canela cravo");
assert.equal(normalizeSearchText("  ÓLEO  DE   ALHO  "), "oleo de alho");
console.log("✓ Testes de normalização passaram.");

// 3. Casos Reais de Busca na Qualivida
const testCases = [
  // Acentuação
  { query: "acafrao", expectedTop: "Açafrão Cúrcuma" },
  { query: "curcuma", expectedContains: "Açafrão Cúrcuma" },
  { query: "cha verde", expectedTop: "Chá verde Talos e Folhas" },
  { query: "oregano", expectedTop: "Orégano Turco" },

  // Erros de Digitação (Typos)
  { query: "psilio", expectedTop: "Psyllium Husk" },
  { query: "psylium", expectedTop: "Psyllium Husk" },
  { query: "espinera", expectedContains: "Espinheira Santa" },
  { query: "chimichuri", expectedContains: "Chimichurri com Pimenta" },
  { query: "zilitol", expectedTop: "Xilitol" },
  { query: "colagenu", expectedTop: "Colágeno Hidrolisado" },
  { query: "amendoas", expectedContains: "Amêndoa" },
  { query: "damascu", expectedTop: "Damasco" },
  { query: "alecrimm", expectedTop: "Alecrim em Flocos" },
  { query: "ginkgo", expectedContains: "Ginko Biloba" },
  { query: "criatina", expectedTop: "Creatina em Pó" },

  // Multi-termos com preposições
  { query: "cha cavalinha", expectedTop: "Chá de Cavalinha" },
  { query: "farinha aveia", expectedTop: "Farinha de Aveia" },
  { query: "semente girassol", expectedTop: "Semente de Girassol" },
  { query: "vitalis", expectedTop: "Vitalis Energy" }
];

console.log("\nExecutando testes de busca no catálogo...");
for (const tc of testCases) {
  const results = searchProducts(catalog, tc.query, (p) => ({
    name: p.name,
    description: p.description,
    categoryName: p.category,
    isPinned: p.isPinned
  }));

  assert.ok(results.length > 0, `Busca por "${tc.query}" deveria retornar resultados.`);

  if (tc.expectedTop) {
    assert.equal(
      results[0].name,
      tc.expectedTop,
      `Busca por "${tc.query}" deveria ter "${tc.expectedTop}" no topo, mas retornou "${results[0].name}".`
    );
  }

  if (tc.expectedContains) {
    const found = results.some((r) => r.name.includes(tc.expectedContains));
    assert.ok(
      found,
      `Busca por "${tc.query}" deveria conter "${tc.expectedContains}" nos resultados.`
    );
  }

  console.log(`✓ "${tc.query}" -> Topo: "${results[0].name}" (${results.length} resultado(s))`);
}

// 4. Teste de Não Falsos Positivos
const negativeQueries = ["smartphone", "computador", "celular xiaomi", "cadeira gamer"];
for (const q of negativeQueries) {
  const results = searchProducts(catalog, q, (p) => ({
    name: p.name,
    description: p.description,
    categoryName: p.category
  }));
  assert.equal(results.length, 0, `Busca por "${q}" não deveria retornar nenhum produto da Qualivida.`);
}
console.log("✓ Testes de falso positivo passaram (termos aleatórios retornam 0).");

console.log("\n==========================================");
console.log(">>> TODOS OS TESTES DE BUSCA PASSARAM! <<<");
console.log("==========================================");
