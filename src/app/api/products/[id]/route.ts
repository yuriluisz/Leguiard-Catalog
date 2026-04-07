import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { productSchema } from "@/lib/validators";

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
    const payload = productSchema.partial().parse(body);

    const existing = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: context.store.id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return NextResponse.json({ message: "Produto nao encontrado" }, { status: 404 });
    }

    if (payload.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: payload.categoryId,
          storeId: context.store.id
        },
        select: {
          id: true
        }
      });

      if (!category) {
        return NextResponse.json({ message: "Categoria invalida para esta loja" }, { status: 400 });
      }
    }

    const updated = await prisma.product.update({
      where: {
        id: existing.id
      },
      data: {
        ...payload,
        description: payload.description === undefined ? undefined : payload.description || null,
        imageUrl: payload.imageUrl === undefined ? undefined : payload.imageUrl || null,
        displayFraction:
          payload.unitType === "UN"
            ? null
            : payload.displayFraction === undefined
              ? undefined
              : payload.displayFraction
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(serializeProduct(updated));
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao atualizar produto",
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
    const existing = await prisma.product.findFirst({
      where: {
        id: params.id,
        storeId: context.store.id
      },
      select: {
        id: true
      }
    });

    if (!existing) {
      return NextResponse.json({ message: "Produto nao encontrado" }, { status: 404 });
    }

    await prisma.product.delete({
      where: {
        id: existing.id
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao remover produto",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
