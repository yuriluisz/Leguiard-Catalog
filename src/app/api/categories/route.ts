import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { categorySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();

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

    const categories = await prisma.category.findMany({
      where: {
        storeId: store.id
      },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
    });

    return NextResponse.json(categories);
  }

  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  const categories = await prisma.category.findMany({
    where: {
      storeId: context.store.id
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = categorySchema.parse(body);

    const created = await prisma.category.create({
      data: {
        ...payload,
        storeId: context.store.id
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao criar categoria",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
