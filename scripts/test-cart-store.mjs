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
  itemsByStore: {}
};

function addItem(storeSlug, item) {
  const currentItems = state.itemsByStore[storeSlug] ?? [];
  const existing = currentItems.find((current) => current.productId === item.productId);

  const nextItems = existing
    ? currentItems.map((current) => {
        if (current.productId !== item.productId) {
          return current;
        }

        const max = item.maxQuantity ?? current.maxQuantity;
        let nextQuantity = current.quantity + item.quantity;
        if (max && nextQuantity > max) {
          nextQuantity = max;
        }

        return {
          ...current,
          maxQuantity: max,
          quantity: nextQuantity,
          subtotal: calculateItemSubtotal(current.unitType, current.unitPrice, nextQuantity)
        };
      })
    : [
        ...currentItems,
        item.maxQuantity && item.quantity > item.maxQuantity
          ? {
              ...item,
              quantity: item.maxQuantity,
              subtotal: calculateItemSubtotal(item.unitType, item.unitPrice, item.maxQuantity)
            }
          : item
      ];

  state.itemsByStore[storeSlug] = nextItems;
}

function updateQuantity(storeSlug, productId, nextQuantity) {
  const currentItems = state.itemsByStore[storeSlug] ?? [];
  if (nextQuantity <= 0) {
    state.itemsByStore[storeSlug] = currentItems.filter((item) => item.productId !== productId);
    return;
  }
  state.itemsByStore[storeSlug] = currentItems.map((item) => {
    if (item.productId !== productId) return item;
    let validQuantity = nextQuantity;
    if (item.maxQuantity && validQuantity > item.maxQuantity) {
      validQuantity = item.maxQuantity;
    }
    return {
      ...item,
      quantity: validQuantity,
      subtotal: calculateItemSubtotal(item.unitType, item.unitPrice, validQuantity)
    };
  });
}

// ==================== TESTES DE ADD ITEM (PREVENÇÃO DO BUG DE SOBREESCRITA) ====================

// Teste 1: Adicionar p1 em sacola vazia
addItem("minhaloja", {
  productId: "p1",
  productName: "Vitalis Energy",
  unitType: "UN",
  unitPrice: 10,
  quantity: 1,
  subtotal: 10
});
assert.equal(state.itemsByStore.minhaloja.length, 1);
assert.equal(state.itemsByStore.minhaloja[0].productId, "p1");

// Teste 2: Adicionar p2 NÃO DEVE sobre-escrever p1; sacola deve ter 2 itens [p1, p2]
addItem("minhaloja", {
  productId: "p2",
  productName: "Queijo Minas",
  unitType: "KG",
  unitPrice: 6,
  quantity: 100,
  subtotal: 6
});
assert.equal(state.itemsByStore.minhaloja.length, 2, "Sacola deve conter 2 itens!");
assert.equal(state.itemsByStore.minhaloja[0].productId, "p1");
assert.equal(state.itemsByStore.minhaloja[1].productId, "p2");

// Teste 3: Adicionar p3
addItem("minhaloja", {
  productId: "p3",
  productName: "Pão de Queijo",
  unitType: "UN",
  unitPrice: 5,
  quantity: 2,
  subtotal: 10
});
assert.equal(state.itemsByStore.minhaloja.length, 3, "Sacola deve conter 3 itens!");
assert.equal(state.itemsByStore.minhaloja[0].productId, "p1");
assert.equal(state.itemsByStore.minhaloja[1].productId, "p2");
assert.equal(state.itemsByStore.minhaloja[2].productId, "p3");

// Teste 4: Re-adicionar p2 incrementa sua quantidade sem duplicar nem mudar a ordem
addItem("minhaloja", {
  productId: "p2",
  productName: "Queijo Minas",
  unitType: "KG",
  unitPrice: 6,
  quantity: 50,
  subtotal: 3
});
assert.equal(state.itemsByStore.minhaloja.length, 3, "Quantidade de itens distintos mantida em 3");
assert.equal(state.itemsByStore.minhaloja[1].productId, "p2");
assert.equal(state.itemsByStore.minhaloja[1].quantity, 150);
assert.equal(state.itemsByStore.minhaloja[1].subtotal, 9);

// Teste 5: Adicionar item novo respeitando maxQuantity inicial
addItem("minhaloja", {
  productId: "combo1",
  productName: "Combo Especial",
  unitType: "UN",
  unitPrice: 50,
  quantity: 5,
  maxQuantity: 2,
  subtotal: 250
});
assert.equal(state.itemsByStore.minhaloja.length, 4);
const combo = state.itemsByStore.minhaloja.find((i) => i.productId === "combo1");
assert.equal(combo.quantity, 2, "Quantidade inicial deve ser travada em maxQuantity");
assert.equal(combo.subtotal, 100, "Subtotal deve ser recalculado para maxQuantity");

// ==================== TESTES DE UPDATE QUANTITY ====================

// 6. Incrementar UN de 1 para 2
updateQuantity("minhaloja", "p1", 2);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").quantity, 2);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").subtotal, 20);

// 7. Decrementar UN de 2 para 1
updateQuantity("minhaloja", "p1", 1);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").quantity, 1);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1").subtotal, 10);

// 8. Decrementar UN de 1 para 0 -> DEVE REMOVER AUTOMATICAMENTE
updateQuantity("minhaloja", "p1", 0);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p1"), undefined);
assert.equal(state.itemsByStore.minhaloja.length, 3);

// 9. Decrementar KG para 0 -> DEVE REMOVER AUTOMATICAMENTE
updateQuantity("minhaloja", "p2", 0);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "p2"), undefined);
assert.equal(state.itemsByStore.minhaloja.length, 2);

// 10. Trava de maxQuantity no updateQuantity
updateQuantity("minhaloja", "combo1", 99);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "combo1").quantity, 2);
assert.equal(state.itemsByStore.minhaloja.find((i) => i.productId === "combo1").subtotal, 100);

console.log("Todos os testes de cart-store passaram com sucesso!");
