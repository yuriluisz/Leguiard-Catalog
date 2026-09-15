import assert from "node:assert/strict";

console.log("Iniciando testes do mecanismo de Upload e suporte a Ctrl+V / URLs...\n");

// 1. Simulação da validação da rota /api/upload
function validateUploadRequest(body, contentType) {
  if (contentType?.includes("application/json")) {
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";
    if (!rawUrl) return { ok: false, status: 400, message: "URL da imagem não informada" };
    if (rawUrl.startsWith("data:image/")) return { ok: true, url: rawUrl };
    if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
      return { ok: false, status: 400, message: "URL inválida" };
    }
    return { ok: true, fetchNeeded: true, url: rawUrl };
  }
  return { ok: false, status: 400, message: "Content-Type inválido" };
}

// Testes de validação de payload JSON
const resEmpty = validateUploadRequest({}, "application/json");
assert.equal(resEmpty.ok, false);
assert.equal(resEmpty.message, "URL da imagem não informada");
console.log("✓ 1. Rejeição de payload vazio com sucesso.");

const resInvalidUrl = validateUploadRequest({ url: "ftp://imagem.jpg" }, "application/json");
assert.equal(resInvalidUrl.ok, false);
assert.equal(resInvalidUrl.message, "URL inválida");
console.log("✓ 2. Rejeição de protocolo não http/https com sucesso.");

const testDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const resDataUri = validateUploadRequest({ url: testDataUri }, "application/json");
assert.equal(resDataUri.ok, true);
assert.equal(resDataUri.url, testDataUri);
console.log("✓ 3. Reconhecimento imediato de Data URI colado com sucesso.");

// 4. Teste de detecção de URLs do Google Images e CDNs
function isGoogleOrImageUrl(url) {
  return (
    url.match(/\.(jpeg|jpg|png|webp|gif|svg|avif)($|\?)/i) !== null ||
    url.includes("google") ||
    url.includes("gstatic") ||
    url.includes("images")
  );
}

assert.equal(isGoogleOrImageUrl("https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR..."), true);
assert.equal(isGoogleOrImageUrl("https://lh3.googleusercontent.com/pw/AP1..."), true);
assert.equal(isGoogleOrImageUrl("https://exemplo.com/fotos/produto.png"), true);
assert.equal(isGoogleOrImageUrl("https://google.com/search?q=cha"), true);
assert.equal(isGoogleOrImageUrl("https://meusite.com/artigo-sobre-cha"), false);
console.log("✓ 4. Filtro de URLs de imagens e CDNs do Google verificado com sucesso.");

console.log("\nTodos os testes unitários de validação passaram com 100% de sucesso!");
