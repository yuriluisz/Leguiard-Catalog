import { notFound } from "next/navigation";

import { CatalogExperience } from "@/components/vitrine/catalog-experience";
import { prisma } from "@/lib/prisma";
import { serializeProduct } from "@/lib/serialize";
import { normalizeStoreSettings } from "@/lib/tenant";

export const revalidate = 60; // ISR revalidation every 60 seconds

export default async function StorefrontPage({
  params
}: {
  params: {
    slug: string;
  };
}) {
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

  // We still need to pass it to a client component if the experience relies heavily on client-side state (cart, filters)
  return (
    <CatalogExperience
      slug={slug}
      initialStore={serializedStore as any}
      initialCategories={categories as any}
      initialProducts={serializedProducts as any}
    />
  );
}
