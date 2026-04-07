import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { resolveAdminStoreContext } from "@/lib/tenant";
import { leadCaptureSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  const leads = await prisma.lead.findMany({
    where: {
      storeId: context.store.id
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json(leads);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = leadCaptureSchema.parse(body);

    const store = await prisma.store.findUnique({
      where: {
        slug: payload.slug
      },
      select: {
        id: true
      }
    });

    if (!store) {
      return NextResponse.json({ message: "Loja nao encontrada" }, { status: 404 });
    }

    const created = await prisma.lead.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        storeId: store.id
      }
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao salvar lead",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
