import assert from "node:assert/strict";

// Implementação isolada das regras para testar lógica
function calculateSubtotal(product, quantity) {
  if (product.unitType === "KG") {
    return Math.round(((Number(product.price) / 100) * quantity) * 100) / 100;
  }
  return Math.round(Number(product.price) * quantity * 100) / 100;
}

function getUnitBadge(product, formatBRL) {
  if (product.unitType === "UN") {
    return "por unidade";
  }
  return `${formatBRL(Number(product.price))} / 100g`;
}

function getMinQuantityLabel(product) {
  if (product.unitType === "UN") {
    return `${product.minQuantity} un mínimo`;
  }
  return `${product.minQuantity}g mínimo`;
}

const mockFormatBRL = (val) => `R$ ${val.toFixed(2).replace(".", ",")}`;

const unProduct = {
  id: "1",
  name: "Vitalis Energy",
  price: 10,
  unitType: "UN",
  minQuantity: 1
};

const kgProduct = {
  id: "2",
  name: "Castanha de Caju",
  price: 8, // R$ 8,00 a cada 100g
  unitType: "KG",
  minQuantity: 50 // 50g mínimo
};

// 1. Subtotal UN
assert.equal(calculateSubtotal(unProduct, 2), 20);
assert.equal(calculateSubtotal(unProduct, 1), 10);

// 2. Subtotal KG (R$ 8 a cada 100g -> 150g = R$ 12; 50g = R$ 4)
assert.equal(calculateSubtotal(kgProduct, 150), 12);
assert.equal(calculateSubtotal(kgProduct, 50), 4);
assert.equal(calculateSubtotal(kgProduct, 75), 6);

// 3. Badges
assert.equal(getUnitBadge(unProduct, mockFormatBRL), "por unidade");
assert.equal(getUnitBadge(kgProduct, mockFormatBRL), "R$ 8,00 / 100g");

// 4. Labels de Mínimo
assert.equal(getMinQuantityLabel(unProduct), "1 un mínimo");
assert.equal(getMinQuantityLabel(kgProduct), "50g mínimo");

console.log("Todos os testes de pricing passaram com sucesso!");
