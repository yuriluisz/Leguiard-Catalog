import assert from "node:assert/strict";

function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function buildCheckoutLines(items) {
  return items.map((item) => {
    const quantityLabel = item.unitType === "KG" ? `${item.quantity}g` : `${item.quantity} un`;
    return `- ${item.productName} | ${quantityLabel} | ${formatBRL(item.subtotal)}`;
  });
}

const items = [
  {
    productName: "Vitalis Energy",
    unitType: "UN",
    quantity: 2,
    subtotal: 20
  },
  {
    productName: "Queijo Minas",
    unitType: "KG",
    quantity: 150,
    subtotal: 9
  }
];

const lines = buildCheckoutLines(items);
assert.equal(lines[0], "- Vitalis Energy | 2 un | R$ 20,00");
assert.equal(lines[1], "- Queijo Minas | 150g | R$ 9,00");

console.log("Todos os testes de whatsapp passaram!");
