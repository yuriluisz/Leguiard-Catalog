import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { categorySchema } from "@/lib/validators";
import { invalidateStoreCache } from "@/lib/cache";

type Context = {
  params: {
    id: string;
  };
};

export async function PATCH(request: Request, { params }: Context) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = categorySchema.partial().parse(body);

    const existing = await prisma.category.findFirst({
      where: {
        id: params.id,
        storeId: context.store.id
      }
    });

    if (!existing) {
      return NextResponse.json({ message: "Categoria nao encontrada" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: {
        id: params.id
      },
      data: payload
    });

    await invalidateStoreCache(context.store.id, context.store.slug);

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao atualizar categoria",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const productsUsingCategory = await prisma.product.count({
      where: {
        categoryId: params.id,
        storeId: context.store.id
      }
    });

    if (productsUsingCategory > 0) {
      return NextResponse.json(
        {
          message: "Nao e possivel remover categoria com produtos vinculados"
        },
        { status: 409 }
      );
    }

    const existing = await prisma.category.findFirst({
      where: {
        id: params.id,
        storeId: context.store.id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return NextResponse.json({ message: "Categoria nao encontrada" }, { status: 404 });
    }

    await prisma.category.delete({
      where: {
        id: existing.id
      }
    });

    await invalidateStoreCache(context.store.id, context.store.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao remover categoria",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
