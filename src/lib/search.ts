/**
 * Normaliza uma string removendo acentuação, caracteres especiais e convertendo para minúsculas.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula a distância de Levenshtein entre duas strings com limite rápido (early exit).
 */
export function levenshteinDistance(a: string, b: string, maxDistance: number = 2): number {
  const aLen = a.length;
  const bLen = b.length;

  if (Math.abs(aLen - bLen) > maxDistance) return maxDistance + 1;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  let prevRow = new Array(bLen + 1);
  let currRow = new Array(bLen + 1);

  for (let j = 0; j <= bLen; j++) {
    prevRow[j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    currRow[0] = i;
    let minInRow = currRow[0];

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        prevRow[j] + 1,
        currRow[j - 1] + 1,
        prevRow[j - 1] + cost
      );
      if (currRow[j] < minInRow) {
        minInRow = currRow[j];
      }
    }

    if (minInRow > maxDistance) return maxDistance + 1;

    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[bLen];
}

/**
 * Reduz uma palavra a uma forma fonética simplificada comum em português.
 * Trata variações como y->i, ph->f, ch->x, z/x->s, duplicação de letras, etc.
 */
export function toPhonetic(text: string): string {
  if (!text) return "";
  return text
    .replace(/ph/g, "f")
    .replace(/y/g, "i")
    .replace(/w/g, "v")
    .replace(/ç/g, "s")
    .replace(/xc|sc|sç/g, "s")
    .replace(/ch/g, "x")
    .replace(/[zx]/g, "s")
    .replace(/k/g, "c")
    .replace(/(.)\1+/g, "$1");
}

/**
 * Avalia se um token de busca confere com um token do texto alvo.
 * Retorna uma pontuação de relevância (0 = sem correspondência).
 */
export function scoreTokenMatch(queryToken: string, targetToken: string): number {
  if (!queryToken || !targetToken) return 0;
  if (queryToken === targetToken) return 100;
  if (targetToken.startsWith(queryToken)) return 85;
  if (targetToken.includes(queryToken)) return 65;

  const qLen = queryToken.length;
  const tLen = targetToken.length;

  // 1. Distância de Levenshtein direta para termos com 4+ caracteres
  if (qLen >= 4 && Math.abs(qLen - tLen) <= 2) {
    const maxDist = qLen >= 6 ? 2 : 1;
    const dist = levenshteinDistance(queryToken, targetToken, maxDist);
    if (dist <= maxDist) {
      return dist === 1 ? 55 : 40;
    }
  }

  // 2. Comparação fonética (y->i, z/x->s, ph->f, duplicação de consoantes, etc.)
  const pQuery = toPhonetic(queryToken);
  const pTarget = toPhonetic(targetToken);

  if (pQuery.length >= 3 && pTarget.length >= 3) {
    if (pQuery === pTarget) return 60;
    if (pTarget.startsWith(pQuery)) return 50;
    if (pTarget.includes(pQuery)) return 40;

    if (pQuery.length >= 4) {
      const maxDist = pQuery.length >= 6 ? 2 : 1;
      const pDist = levenshteinDistance(pQuery, pTarget, maxDist);
      if (pDist <= maxDist) {
        return pDist === 1 ? 45 : 30;
      }
    }
  }

  return 0;
}

export interface SearchableFields {
  name: string;
  description?: string | null;
  categoryName?: string | null;
  isPinned?: boolean;
}

/**
 * Calcula a pontuação de relevância de um produto para uma consulta de busca.
 * Retorna > 0 se TODOS os tokens da busca corresponderem ao produto (AND logic).
 */
export function calculateRelevanceScore(
  fields: SearchableFields,
  query: string
): number {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) return 1;

  const normName = normalizeSearchText(fields.name);
  const normDesc = normalizeSearchText(fields.description);
  const normCat = normalizeSearchText(fields.categoryName);

  // Se a consulta inteira estiver contida exatamente no nome
  let baseScore = 0;
  if (normName === normQuery) {
    baseScore += 500;
  } else if (normName.startsWith(normQuery)) {
    baseScore += 300;
  } else if (normName.includes(normQuery)) {
    baseScore += 200;
  }

  const queryTokens = normQuery.split(" ").filter((t) => t.length > 0);
  if (queryTokens.length === 0) return 1;

  const nameTokens = normName.split(" ").filter((t) => t.length > 0);
  const descTokens = normDesc.split(" ").filter((t) => t.length > 0);
  const catTokens = normCat.split(" ").filter((t) => t.length > 0);

  let totalTokenScore = 0;

  for (const qToken of queryTokens) {
    let bestTokenScore = 0;

    // 1. Procura no Nome (peso máximo x 3 + bônus de posição inicial)
    let bestNameScore = 0;
    for (let i = 0; i < nameTokens.length; i++) {
      const nToken = nameTokens[i];
      const s = scoreTokenMatch(qToken, nToken);
      if (s > 0) {
        const positionBonus = i === 0 ? 30 : 0;
        const score = s * 3 + positionBonus;
        if (score > bestNameScore) bestNameScore = score;
      }
    }
    if (bestNameScore > bestTokenScore) bestTokenScore = bestNameScore;

    // 2. Procura na Categoria (peso x 1.5)
    for (const cToken of catTokens) {
      const s = scoreTokenMatch(qToken, cToken);
      if (s * 1.5 > bestTokenScore) bestTokenScore = s * 1.5;
    }

    // 3. Procura na Descrição (peso x 1.0)
    for (const dToken of descTokens) {
      const s = scoreTokenMatch(qToken, dToken);
      if (s > bestTokenScore) bestTokenScore = s;
    }

    // Se algum token da busca não encontrou nenhuma correspondência, descarta o item
    if (bestTokenScore === 0) {
      return 0;
    }

    totalTokenScore += bestTokenScore;
  }

  // Bônus de densidade do título (títulos mais objetivos e diretos ganham preferência sobre títulos longos)
  if (nameTokens.length > 0) {
    const densityBonus = Math.round((queryTokens.length / nameTokens.length) * 20);
    totalTokenScore += densityBonus;
  }

  let finalScore = baseScore + totalTokenScore;

  // Bônus para produtos fixados quando correspondem à busca
  if (fields.isPinned) {
    finalScore += 1000;
  }

  return finalScore;
}

/**
 * Filtra e ordena uma lista de produtos por relevância utilizando busca fuzzy tolerante a erros.
 */
export function searchProducts<T>(
  items: T[],
  query: string,
  extractor: (item: T) => SearchableFields = (item: any) => ({
    name: item.name,
    description: item.description,
    categoryName: item.category?.name,
    isPinned: item.isPinned
  })
): T[] {
  const trimmed = query.trim();
  if (!trimmed) {
    // Sem busca: preserva ordem padrão (isPinned primeiro, depois ordem original)
    return [...items].sort((a: any, b: any) => {
      const aPinned = a.isPinned ? 1 : 0;
      const bPinned = b.isPinned ? 1 : 0;
      return bPinned - aPinned;
    });
  }

  const scored: { item: T; score: number }[] = [];

  for (const item of items) {
    const fields = extractor(item);
    const score = calculateRelevanceScore(fields, trimmed);
    if (score > 0) {
      scored.push({ item, score });
    }
  }

  // Ordena decrescente por score de relevância
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.item);
}
