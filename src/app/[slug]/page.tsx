import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogExperience } from "@/components/vitrine/catalog-experience";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { normalizeStoreSettings } from "@/lib/tenant";

export const revalidate = 60; // ISR revalidation every 60 seconds

type Props = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug.trim().toLowerCase();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      name: true,
      address: true,
      phone: true,
      logoUrl: true,
      settings: true
    }
  });

  if (!store) {
    return {
      title: "Loja não encontrada | Leguiard Catalog"
    };
  }

  const title = `${store.name} | Catálogo Online & Pedidos WhatsApp`;
  const description = `Confira os produtos e faça seu pedido direto pelo WhatsApp com a ${store.name}.${
    store.address ? ` Endereço: ${store.address}.` : ""
  }`;

  const images = store.logoUrl ? [{ url: store.logoUrl, width: 800, height: 800, alt: store.name }] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: store.name,
      images
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: store.logoUrl ? [store.logoUrl] : []
    }
  };
}

export default async function StorefrontPage({ params }: Props) {
  const slug = params.slug.trim().toLowerCase();

  const store = await prisma.store.findUnique({
    where: { slug }
  });

  if (!store) {
    notFound();
  }

  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      where: { storeId: store.id },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
    }),
    prisma.product.findMany({
      where: {
        storeId: store.id,
        isActive: true,
        isOutOfStock: false
      },
      include: {
        category: true
      },
      orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }]
    })
  ]);

  const serializedStore = {
    ...store,
    settings: normalizeStoreSettings(store.settings)
  };

  const serializedProducts = products.map(serializeProduct);

  return (
    <CatalogExperience
      slug={slug}
      initialStore={serializedStore as any}
      initialCategories={categories as any}
      initialProducts={serializedProducts as any}
    />
  );
}
