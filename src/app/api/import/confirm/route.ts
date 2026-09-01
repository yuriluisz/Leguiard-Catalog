import { NextResponse } from "next/server";
import { z } from "zod";

import { mapImportRow } from "@/lib/csv-mapper";
import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { invalidateStoreCache } from "@/lib/cache";

const mappingSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.string().min(1),
  unitType: z.string().min(1),
  displayFraction: z.string().optional(),
  minQuantity: z.string().optional(),
  imageUrl: z.string().optional(),
  isActive: z.string().optional()
});

const importSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
  mapping: mappingSchema
});

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido";
}

export async function POST(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = importSchema.parse(body);

    const mappedRows = payload.rows.map((row) => mapImportRow(row, payload.mapping));
    const rowsWithName = mappedRows.filter((row) => row.name.length > 0).length;
    const rowsWithPositivePrice = mappedRows.filter((row) => row.price > 0).length;
    const validRows = mappedRows.filter((row) => row.name.length > 0 && row.price > 0);

    if (validRows.length === 0) {
      return NextResponse.json(
        {
          message:
            "Nenhum item valido para importar. Verifique mapeamento de Nome e Preco. " +
            `Linhas analisadas: ${mappedRows.length}, com nome: ${rowsWithName}, com preco > 0: ${rowsWithPositivePrice}. ` +
            "Formatos aceitos para preco: 10,50 | 10.50 | R$ 10,50"
        },
        { status: 400 }
      );
    }

    const categories = await prisma.category.findMany({
      where: {
        storeId: context.store.id
      },
      select: {
        id: true,
        name: true
      }
    });

    const categoryMap = new Map<string, string>();
    categories.forEach((category) => {
      categoryMap.set(normalizeKey(category.name), category.id);
    });

    let displayOrder =
      (await prisma.category.aggregate({
        where: {
          storeId: context.store.id
        },
        _max: {
          displayOrder: true
        }
      }))._max.displayOrder ?? 0;

    let importedCount = 0;
    let skippedCount = 0;
    const issues: string[] = [];

    for (const row of validRows) {
      try {
        const categoryKey = normalizeKey(row.categoryName || "Sem categoria");
        let categoryId = categoryMap.get(categoryKey);

        if (!categoryId) {
          displayOrder += 1;

          const createdCategory = await prisma.category.create({
            data: {
              storeId: context.store.id,
              name: row.categoryName || "Sem categoria",
              displayOrder
            }
          });

          categoryId = createdCategory.id;
          categoryMap.set(categoryKey, createdCategory.id);
        }

        await prisma.product.create({
          data: {
            storeId: context.store.id,
            categoryId,
            name: row.name,
            description: row.description || null,
            price: row.price,
            unitType: row.unitType,
            displayFraction: row.unitType === "KG" ? row.displayFraction : null,
            minQuantity: row.minQuantity,
            imageUrl: row.imageUrl || null,
            isActive: row.isActive,
            isOutOfStock: false
          }
        });

        importedCount += 1;
      } catch (error) {
        skippedCount += 1;

        if (issues.length < 15) {
          issues.push(`${row.name || "(sem nome)"}: ${toErrorMessage(error)}`);
        }
      }
    }

    if (importedCount === 0) {
      return NextResponse.json(
        {
          message:
            "Nao foi possivel importar nenhum item. Revise os dados da planilha e o mapeamento. " +
            `Linhas validas para tentativa: ${validRows.length}.`,
          skippedCount,
          issues
        },
        { status: 400 }
      );
    }

    // Invalidate store cache after successful import
    await invalidateStoreCache(context.store.id, context.store.slug);

    return NextResponse.json({
      ok: true,
      importedCount,
      skippedCount,
      issues
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao confirmar importacao",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
