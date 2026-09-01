import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { normalizeStoreSettings, resolveAdminStoreContext } from "@/lib/tenant";
import { storeSchema } from "@/lib/validators";
import { getOrSetCache, invalidateStoreCache } from "@/lib/cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();

  if (slug) {
    const cachedStore = await getOrSetCache(`store:slug:${slug}`, 600, async () => {
      const store = await prisma.store.findUnique({
        where: {
          slug
        }
      });

      if (!store) {
        return null;
      }

      return {
        ...store,
        settings: normalizeStoreSettings(store.settings)
      };
    });

    if (!cachedStore) {
      return NextResponse.json({ message: "Loja nao encontrada" }, { status: 404 });
    }

    return NextResponse.json(cachedStore);
  }

  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  return NextResponse.json({
    ...context.store,
    settings: normalizeStoreSettings(context.store.settings)
  });
}

export async function PUT(request: Request) {
  const context = await resolveAdminStoreContext(request);
  if (!context.ok) {
    return NextResponse.json({ message: context.message }, { status: context.status });
  }

  try {
    const body = await request.json();
    const payload = storeSchema.parse(body);

    const updated = await prisma.store.update({
      where: {
        id: context.store.id
      },
      data: {
        slug: payload.slug,
        name: payload.name,
        address: payload.address,
        phone: payload.phone,
        logoUrl: payload.logoUrl || null,
        settings: payload.settings
      }
    });

    // Invalidate caches for this store
    await invalidateStoreCache(context.store.id, context.store.slug);
    if (payload.slug !== context.store.slug) {
      await invalidateStoreCache(context.store.id, payload.slug);
    }

    return NextResponse.json({
      ...updated,
      settings: normalizeStoreSettings(updated.settings)
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Falha ao salvar configuracoes da loja",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 400 }
    );
  }
}
