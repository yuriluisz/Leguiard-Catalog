import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { batchUpdateSchema } from "@/lib/validators";
import { invalidateStoreCache } from "@/lib/cache";

export async function PATCH(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = batchUpdateSchema.parse(body);

    const result = await prisma.product.updateMany({
      where: {
        storeId: context.store.id,
        id: {
          in: payload.productIds
        }
      },
      data: payload.data
    });

    // Invalidate store cache
    await invalidateStoreCache(context.store.id, context.store.slug);

    return NextResponse.json({
      ok: true,
      updatedCount: result.count
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha na edicao em lote",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
