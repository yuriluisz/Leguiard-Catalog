import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { resolveSystemAdminContext } from "@/lib/tenant";

const createStoreSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido"),
  name: z.string().trim().min(2),
  address: z.string().trim().min(5),
  phone: z.string().trim().min(8),
  logoUrl: z.string().url().optional().or(z.literal(""))
});

const defaultSettings = {
  theme: {
    primaryColor: "#1447e6",
    accentColor: "#1a4eda",
    backgroundColor: "#ffffff"
  },
  checkout: {
    deliveryFee: 0,
    acceptedPayments: ["PIX", "CARTAO", "DINHEIRO"],
    whatsappTemplate: "Ola! Segue meu pedido:"
  },
  social: {
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    youtubeUrl: "",
    siteUrl: ""
  }
};

export async function POST(request: Request) {
  const adminContext = await resolveSystemAdminContext();
  if (!adminContext.ok) {
    return NextResponse.json({ message: adminContext.message }, { status: adminContext.status });
  }

  try {
    const body = await request.json();
    const payload = createStoreSchema.parse(body);

    const created = await prisma.store.create({
      data: {
        slug: payload.slug.toLowerCase(),
        name: payload.name,
        address: payload.address,
        phone: payload.phone,
        logoUrl: payload.logoUrl || null,
        settings: defaultSettings
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    });

    return NextResponse.json(
      {
        message: "Loja criada com sucesso",
        store: created
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao criar loja",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
