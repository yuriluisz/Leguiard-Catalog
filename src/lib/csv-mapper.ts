export type ImportRow = Record<string, unknown>;

export type ImportMapping = {
  name: string;
  category: string;
  description?: string;
  price: string;
  unitType: string;
  displayFraction?: string;
  minQuantity?: string;
  imageUrl?: string;
  isActive?: string;
};

function parseLooseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const text = String(value ?? "").trim();
  if (!text) {
    return NaN;
  }

  let normalized = text
    .replace(/\s/g, "")
    .replace(/[^\d,.-]/g, "");

  if (!normalized || !/[\d]/.test(normalized)) {
    return NaN;
  }

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function normalizeUnit(value: unknown): "KG" | "UN" {
  const text = String(value ?? "")
    .trim()
    .toUpperCase();

  if (!text) {
    return "UN";
  }

  if (["KG", "KILO", "QUILO", "GRAMA", "GRAMAS", "GR", "G"].some((token) => text.includes(token))) {
    return "KG";
  }

  return "UN";
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  const text = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "sim", "yes", "ativo"].includes(text);
}

export function mapImportRow(row: ImportRow, mapping: ImportMapping) {
  const unitType = normalizeUnit(row[mapping.unitType]);
  const price = parseLooseNumber(row[mapping.price]);

  const rawMinQuantity = mapping.minQuantity ? parseLooseNumber(row[mapping.minQuantity]) : 1;
  const rawFraction = mapping.displayFraction ? parseLooseNumber(row[mapping.displayFraction]) : null;

  const parsedFraction = Number.isFinite(rawFraction ?? NaN) ? Math.round(Number(rawFraction)) : null;

  return {
    name: String(row[mapping.name] ?? "").trim(),
    categoryName: String(row[mapping.category] ?? "Sem categoria").trim(),
    description: mapping.description ? String(row[mapping.description] ?? "").trim() : "",
    price: Number.isFinite(price) ? price : 0,
    unitType,
    displayFraction: Number.isFinite(parsedFraction ?? NaN) && parsedFraction && parsedFraction > 0 ? parsedFraction : null,
    minQuantity: Number.isFinite(rawMinQuantity) && rawMinQuantity > 0 ? rawMinQuantity : 1,
    imageUrl: mapping.imageUrl ? String(row[mapping.imageUrl] ?? "").trim() : "",
    isActive: mapping.isActive ? normalizeBoolean(row[mapping.isActive]) : true
  };
}
