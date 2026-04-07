const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const storeSlug = process.env.STORE_SLUG || "minha-loja";
const injectionSlug = "' OR 1=1--";

/**
 * Minimal security smoke tests focused on route protection and malformed inputs.
 *
 * Usage:
 *   npm run test:security
 *   BASE_URL=http://localhost:3000 STORE_SLUG=minha-loja npm run test:security
 */

function buildUrl(path, query) {
  const url = new URL(path, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

async function send(request) {
  const url = buildUrl(request.path, request.query);
  const headers = { ...(request.headers || {}) };

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (request.json !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(request.json);
  }

  if (request.formData) {
    init.body = request.formData;
  }

  try {
    const response = await fetch(url, init);
    const text = await response.text();

    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    return {
      ok: true,
      url,
      status: response.status,
      text,
      json
    };
  } catch (error) {
    return {
      ok: false,
      url,
      status: -1,
      text: error instanceof Error ? error.message : "Network error",
      json: null
    };
  }
}

function shortText(value) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 180) {
    return clean;
  }

  return `${clean.slice(0, 177)}...`;
}

function hasExpectedStatus(status, allowedStatuses) {
  return allowedStatuses.includes(status);
}

function evaluate(test, result) {
  if (!result.ok) {
    return {
      pass: false,
      reason: `Network error: ${result.text}`
    };
  }

  if (result.status === 500) {
    return {
      pass: false,
      reason: "Endpoint returned 500 (unexpected server error)"
    };
  }

  if (!hasExpectedStatus(result.status, test.expectStatus)) {
    return {
      pass: false,
      reason: `Expected status ${test.expectStatus.join("/")}, got ${result.status}`
    };
  }

  if (typeof test.assertJson === "function") {
    const assertion = test.assertJson(result.json);
    if (!assertion.ok) {
      return {
        pass: false,
        reason: assertion.reason
      };
    }
  }

  return {
    pass: true,
    reason: "ok"
  };
}

function makePngFormData() {
  const fd = new FormData();
  fd.append("file", new Blob(["fake-image"], { type: "image/png" }), "fake.png");
  return fd;
}

function makeCsvFormData() {
  const fd = new FormData();
  fd.append("file", new Blob(["nome,preco\nProduto A,10.00\n"], { type: "text/csv" }), "import.csv");
  return fd;
}

const tests = [
  {
    name: "Anon cannot read admin store settings",
    request: { method: "GET", path: "/api/store" },
    expectStatus: [401, 403]
  },
  {
    name: "Public store slug lookup does not 500",
    request: { method: "GET", path: "/api/store", query: { slug: storeSlug } },
    expectStatus: [200, 404]
  },
  {
    name: "Store slug SQL-like payload is rejected",
    request: { method: "GET", path: "/api/store", query: { slug: injectionSlug } },
    expectStatus: [404]
  },
  {
    name: "Anon cannot update store",
    request: {
      method: "PUT",
      path: "/api/store",
      json: {
        slug: "hack-store",
        name: "Hack Store",
        address: "Rua 1",
        phone: "5511999999999"
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot list admin categories",
    request: { method: "GET", path: "/api/categories" },
    expectStatus: [401, 403]
  },
  {
    name: "Public categories by slug do not 500",
    request: { method: "GET", path: "/api/categories", query: { slug: storeSlug } },
    expectStatus: [200, 404]
  },
  {
    name: "Anon cannot create category",
    request: {
      method: "POST",
      path: "/api/categories",
      json: { name: "Invasao", displayOrder: 0 }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot update category by id",
    request: {
      method: "PATCH",
      path: "/api/categories/00000000-0000-0000-0000-000000000000",
      json: { name: "Pwned" }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot delete category by id",
    request: {
      method: "DELETE",
      path: "/api/categories/00000000-0000-0000-0000-000000000000"
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot access products admin mode",
    request: { method: "GET", path: "/api/products", query: { admin: 1 } },
    expectStatus: [401, 403]
  },
  {
    name: "Public product list by slug does not 500",
    request: { method: "GET", path: "/api/products", query: { slug: storeSlug } },
    expectStatus: [200, 404]
  },
  {
    name: "Products slug SQL-like payload is rejected",
    request: { method: "GET", path: "/api/products", query: { slug: injectionSlug } },
    expectStatus: [404]
  },
  {
    name: "Anon cannot create product",
    request: {
      method: "POST",
      path: "/api/products",
      json: {
        categoryId: "00000000-0000-0000-0000-000000000000",
        name: "Hack Produto",
        price: 10,
        unitType: "UN",
        minQuantity: 1
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot patch product",
    request: {
      method: "PATCH",
      path: "/api/products/00000000-0000-0000-0000-000000000000",
      json: { name: "X" }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot delete product",
    request: {
      method: "DELETE",
      path: "/api/products/00000000-0000-0000-0000-000000000000"
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot batch update products",
    request: {
      method: "PATCH",
      path: "/api/products/batch",
      json: {
        productIds: ["00000000-0000-0000-0000-000000000000"],
        data: { isActive: false }
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot list leads",
    request: { method: "GET", path: "/api/leads" },
    expectStatus: [401, 403]
  },
  {
    name: "Lead create with bad slug is rejected",
    request: {
      method: "POST",
      path: "/api/leads",
      json: { slug: injectionSlug, name: "Jo", phone: "11999999999" }
    },
    expectStatus: [400, 404]
  },
  {
    name: "Checkout with bad slug is rejected",
    request: {
      method: "POST",
      path: "/api/checkout",
      json: {
        slug: injectionSlug,
        customerName: "Cliente Teste",
        customerPhone: "11999999999",
        fulfillmentType: "RETIRADA",
        paymentMethod: "PIX",
        items: [
          {
            productId: "00000000-0000-0000-0000-000000000000",
            productName: "Item",
            unitType: "UN",
            unitPrice: 1,
            quantity: 1,
            subtotal: 1
          }
        ]
      }
    },
    expectStatus: [400, 404]
  },
  {
    name: "Anon cannot upload images",
    request: {
      method: "POST",
      path: "/api/upload",
      formData: makePngFormData()
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot preview imports",
    request: {
      method: "POST",
      path: "/api/import/preview",
      formData: makeCsvFormData()
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot confirm imports",
    request: {
      method: "POST",
      path: "/api/import/confirm",
      json: {
        rows: [{ nome: "Produto", valor: "10" }],
        mapping: {
          name: "nome",
          category: "categoria",
          price: "valor",
          unitType: "unidade"
        }
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot access system-admin users API",
    request: { method: "GET", path: "/api/admin/users" },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot create users via admin API",
    request: {
      method: "POST",
      path: "/api/admin/users",
      json: {
        email: "evil@example.com",
        password: "123456",
        storeSlug,
        role: "OWNER"
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Anon cannot create stores via admin API",
    request: {
      method: "POST",
      path: "/api/admin/stores",
      json: {
        slug: "hack-store",
        name: "Hack Store",
        address: "Rua Hacker 123",
        phone: "5511999999999"
      }
    },
    expectStatus: [401, 403]
  },
  {
    name: "Store access endpoint hides admin button for anon",
    request: { method: "GET", path: "/api/store/access", query: { slug: storeSlug } },
    expectStatus: [200],
    assertJson: (json) => {
      if (!json || json.canAccess !== false) {
        return { ok: false, reason: "Expected canAccess=false for unauthenticated users" };
      }

      return { ok: true };
    }
  }
];

(async () => {
  console.log(`Security route test started against ${baseUrl}`);
  console.log(`Store slug used: ${storeSlug}`);
  console.log("");

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await send(test.request);
    const outcome = evaluate(test, result);

    if (outcome.pass) {
      passed += 1;
      console.log(`[PASS] ${test.name} -> ${result.status}`);
    } else {
      failed += 1;
      console.log(`[FAIL] ${test.name} -> ${result.status}`);
      console.log(`       ${outcome.reason}`);
      console.log(`       URL: ${result.url}`);
      console.log(`       Body: ${shortText(result.text)}`);
    }
  }

  console.log("");
  console.log(`Summary: ${passed}/${tests.length} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exitCode = 1;
  }
})();
