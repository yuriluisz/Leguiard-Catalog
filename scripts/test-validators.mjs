import assert from "node:assert/strict";
import { z } from "zod";

const baseProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  unitType: z.enum(["UN", "KG"]),
  displayFraction: z.coerce.number().int().positive().optional().nullable(),
  minQuantity: z.coerce.number().positive(),
  isActive: z.coerce.boolean().default(true),
  isOutOfStock: z.coerce.boolean().default(false)
});

const productSchema = baseProductSchema.refine(
  (data) => {
    if (data.unitType === "UN") {
      return Number.isInteger(data.minQuantity) && data.minQuantity >= 1;
    }
    if (data.unitType === "KG") {
      return Number.isInteger(data.minQuantity) && data.minQuantity >= 10;
    }
    return true;
  },
  {
    message: "Quantidade mínima inválida para a unidade selecionada",
    path: ["minQuantity"]
  }
);

const productUpdateSchema = baseProductSchema.partial().refine(
  (data) => {
    if (data.minQuantity !== undefined) {
      if (data.unitType === "UN") {
        return Number.isInteger(data.minQuantity) && data.minQuantity >= 1;
      }
      if (data.unitType === "KG") {
        return Number.isInteger(data.minQuantity) && data.minQuantity >= 10;
      }
      return Number.isInteger(data.minQuantity) && data.minQuantity >= 1;
    }
    return true;
  },
  {
    message: "Quantidade mínima inválida para a unidade selecionada",
    path: ["minQuantity"]
  }
);

// 1. UN com decimal 1.01 DEVE FALHAR
const invalidUn = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Produto Invalido",
  price: 15,
  unitType: "UN",
  minQuantity: 1.01
};
assert.equal(productSchema.safeParse(invalidUn).success, false);

// 2. UN com inteiro 1 DEVE PASSAR
const validUn = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Produto Valido",
  price: 15,
  unitType: "UN",
  minQuantity: 1
};
assert.equal(productSchema.safeParse(validUn).success, true);

// 3. KG com 50g DEVE PASSAR
const validKg = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Queijo Minas",
  price: 8.5,
  unitType: "KG",
  minQuantity: 50
};
assert.equal(productSchema.safeParse(validKg).success, true);

// 4. KG com < 10g DEVE FALHAR
const invalidKg = {
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  name: "Queijo Minas",
  price: 8.5,
  unitType: "KG",
  minQuantity: 5
};
assert.equal(productSchema.safeParse(invalidKg).success, false);

// 5. Update parcial DEVE FUNCIONAR
assert.equal(productUpdateSchema.safeParse({ minQuantity: 2, unitType: "UN" }).success, true);
assert.equal(productUpdateSchema.safeParse({ minQuantity: 2.5, unitType: "UN" }).success, false);

console.log("Todos os testes de validators passaram!");
