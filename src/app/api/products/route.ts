import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { productSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const categoryId = searchParams.get("categoryId")?.trim();
  const slug = searchParams.get("slug")?.trim().toLowerCase();
  const adminMode = searchParams.get("admin") === "1";

  let storeId: string;

  if (slug) {
    const store = await prisma.store.findUnique({
      where: {
        slug
      },
      select: {
        id: true
      }
    });

    if (!store) {
      return NextResponse.json({ message: "Loja nao encontrada" }, { status: 404 });
    }

    storeId = store.id;
  } else {
    const context = await resolveAdminStoreContext(request);
    if (!context.ok) {
      return NextResponse.json({ message: context.message }, { status: context.status });
    }

    storeId = context.store.id;
  }

  const products = await prisma.product.findMany({
    where: {
      storeId,
      ...(search
        ? {
            name: {
              contains: search,
              mode: "insensitive"
            }
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(!slug && adminMode
        ? {}
        : {
            isActive: true,
            isOutOfStock: false
          })
    },
    include: {
      category: true
    },
    orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }]
  });

  return NextResponse.json(products.map(serializeProduct));
}

export async function POST(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = productSchema.parse(body);

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

    const created = await prisma.product.create({
      data: {
        storeId: context.store.id,
        ...payload,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        displayFraction: payload.unitType === "KG" ? payload.displayFraction ?? null : null
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(serializeProduct(created), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao criar produto",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
