import assert from "node:assert/strict";

function toCurrency(value) {
  return Number(value.toFixed(2));
}

function calculateItemSubtotal(unitType, unitPrice, quantity) {
  if (unitType === "KG") {
    return toCurrency((unitPrice / 100) * quantity);
  }
  return toCurrency(unitPrice * quantity);
}

// Simulação de estado da store
let state = {
  itemsByStore: {
    minhaloja: [
      {
        productId: "p1",
        productName: "Vitalis Energy",
        unitType: "UN",
        unitPrice: 10,
        quantity: 1,
        subtotal: 10
      },
      {
        productId: "p2",
        productName: "Queijo Minas",
        unitType: "KG",
        unitPrice: 6, // R$ 6 / 100g
        quantity: 100, // 100g
        subtotal: 6
      }
    ]
  }
};

function updateQuantity(storeSlug, productId, nextQuantity) {
  const currentItems = state.itemsByStore[storeSlug] ?? [];
  if (nextQuantity <= 0) {
    state.itemsByStore[storeSlug] = currentItems.filter((item) => item.productId !== productId);
    return;
  }
  state.itemsByStore[storeSlug] = currentItems.map((item) => {
    if (item.productId !== productId) return item;
    return {
      ...item,
      quantity: nextQuantity,
      subtotal: calculateItemSubtotal(item.unitType, item.unitPrice, nextQuantity)
    };
  });
}

// 1. Incrementar UN de 1 para 2
updateQuantity("minhaloja", "p1", 2);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").quantity, 2);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").subtotal, 20);

// 2. Decrementar UN de 2 para 1
updateQuantity("minhaloja", "p1", 1);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").quantity, 1);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").subtotal, 10);

// 3. Decrementar UN de 1 para 0 -> DEVE REMOVER AUTOMATICAMENTE
updateQuantity("minhaloja", "p1", 0);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1"), undefined);
assert.equal(state.itemsByStore.minhaloja.length, 1);

// 4. Incrementar KG de 100g (+50g) para 150g -> Subtotal deve ser R$ 9,00
updateQuantity("minhaloja", "p2", 150);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p2").quantity, 150);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p2").subtotal, 9);

// 5. Decrementar KG para 0 -> DEVE REMOVER AUTOMATICAMENTE
updateQuantity("minhaloja", "p2", 0);
assert.equal(state.itemsByStore.minhaloja.length, 0);

console.log("Todos os testes de cart-store passaram!");
