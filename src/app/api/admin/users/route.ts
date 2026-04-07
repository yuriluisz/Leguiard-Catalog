import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { resolveSystemAdminContext } from "@/lib/tenant";

const createUserSchema = z.object({
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  password: z.string().min(6),
  storeSlug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido"),
  role: z.string().trim().min(2).default("OWNER")
});

export async function GET() {
  const adminContext = await resolveSystemAdminContext();
  if (!adminContext.ok) {
    return NextResponse.json({ message: adminContext.message }, { status: adminContext.status });
  }

  const [users, stores] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        storeMembership: {
          select: {
            id: true,
            role: true,
            store: {
              select: {
                id: true,
                slug: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.store.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    })
  ]);

  return NextResponse.json({
    users,
    stores
  });
}

export async function POST(request: Request) {
  const adminContext = await resolveSystemAdminContext();
  if (!adminContext.ok) {
    return NextResponse.json({ message: adminContext.message }, { status: adminContext.status });
  }

  try {
    const body = await request.json();
    const payload = createUserSchema.parse(body);

    const normalizedEmail = payload.email.toLowerCase();
    const normalizedSlug = payload.storeSlug.toLowerCase();

    const store = await prisma.store.findUnique({
      where: {
        slug: normalizedSlug
      },
      select: {
        id: true,
        slug: true,
        name: true
      }
    });

    if (!store) {
      return NextResponse.json({ message: "Loja nao encontrada para o slug informado" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await prisma.user.upsert({
      where: {
        email: normalizedEmail
      },
      update: {
        name: payload.name ?? undefined,
        passwordHash
      },
      create: {
        name: payload.name,
        email: normalizedEmail,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    const membership = await prisma.storeUser.upsert({
      where: {
        userId_storeId: {
          userId: user.id,
          storeId: store.id
        }
      },
      update: {
        role: payload.role
      },
      create: {
        userId: user.id,
        storeId: store.id,
        role: payload.role
      },
      select: {
        id: true,
        role: true
      }
    });

    return NextResponse.json(
      {
        message: "Usuario salvo com sucesso",
        user,
        store,
        membership
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao salvar usuario",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
