import { performance } from "perf_hooks";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const storeSlug = process.env.STORE_SLUG || "admin";

async function measure(label, url) {
  const start = performance.now();
  const res = await fetch(url);
  const duration = (performance.now() - start).toFixed(2);
  const ok = res.status === 200;
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label} -> status ${res.status} in ${duration}ms`);
  return { duration: parseFloat(duration), ok };
}

async function run() {
  console.log(`\n--- INICIANDO TESTE DE BENCHMARK & CACHE (${baseUrl}) ---\n`);

  // 1. Store Endpoint
  console.log("1. Testando endpoint de Loja (/api/store):");
  const storeUrl = `${baseUrl}/api/store?slug=${storeSlug}`;
  const store1 = await measure("1ª Chamada (Cache Miss / Banco)", storeUrl);
  const store2 = await measure("2ª Chamada (Cache Hit / Memória/Redis)", storeUrl);
  const store3 = await measure("3ª Chamada (Cache Hit)", storeUrl);

  console.log(`-> Ganho de velocidade: ${(store1.duration / (store2.duration || 1)).toFixed(1)}x mais rápido\n`);

  // 2. Categories Endpoint
  console.log("2. Testando endpoint de Categorias (/api/categories):");
  const catUrl = `${baseUrl}/api/categories?slug=${storeSlug}`;
  const cat1 = await measure("1ª Chamada (Cache Miss)", catUrl);
  const cat2 = await measure("2ª Chamada (Cache Hit)", catUrl);

  console.log(`-> Ganho de velocidade: ${(cat1.duration / (cat2.duration || 1)).toFixed(1)}x mais rápido\n`);

  // 3. Products Endpoint
  console.log("3. Testando endpoint de Produtos (/api/products):");
  const prodUrl = `${baseUrl}/api/products?slug=${storeSlug}`;
  const prod1 = await measure("1ª Chamada (Cache Miss)", prodUrl);
  const prod2 = await measure("2ª Chamada (Cache Hit)", prodUrl);
  const prod3 = await measure("3ª Chamada (Cache Hit)", prodUrl);

  console.log(`-> Ganho de velocidade: ${(prod1.duration / (prod2.duration || 1)).toFixed(1)}x mais rápido\n`);

  console.log("--- RESULTADO DO BENCHMARK CONCLUÍDO COM SUCESSO! ---\n");
}

run().catch((err) => {
  console.error("Erro no teste de benchmark:", err);
  process.exit(1);
});
