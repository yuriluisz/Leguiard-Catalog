import { NextResponse } from "next/server";
import Papa from "papaparse";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        storeId: context.store.id
      },
      include: {
        category: true
      },
      orderBy: [
        { isPinned: "desc" as any },
        { category: { displayOrder: "asc" } },
        { name: "asc" }
      ]
    });

    const rows = products.map((product) => ({
      Nome: product.name,
      Categoria: product.category?.name || "Sem categoria",
      Preço: Number(product.price).toFixed(2),
      Unidade: product.unitType,
      Descrição: product.description || "",
      "Fração (g)": product.displayFraction ?? "",
      "Quantidade Mínima": Number(product.minQuantity),
      "URL da Imagem": product.imageUrl || "",
      Ativo: product.isActive ? "Sim" : "Não"
    }));

    const csv = Papa.unparse(rows, {
      quotes: true,
      delimiter: ";"
    });

    // \uFEFF (UTF-8 BOM) ensures Excel opens special characters correctly
    const content = "\uFEFF" + csv;
    const date = new Date().toISOString().split("T")[0];
    const filename = `catalogo-${context.store.slug}-${date}.csv`;

    return new Response(content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao exportar catálogo",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
