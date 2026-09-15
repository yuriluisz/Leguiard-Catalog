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
  searchParams?: {
    p?: string;
    [key: string]: string | string[] | undefined;
  };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = params.slug.trim().toLowerCase();

  const store = await prisma.store.findUnique({
    where: { slug },
    select: {
      id: true,
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

  const settings = normalizeStoreSettings(store.settings);
  const productId = typeof searchParams?.p === "string" ? searchParams.p.trim() : null;

  // 1. Cenário: Compartilhamento de Produto Específico
  if (productId) {
    const product = await prisma.product.findFirst({
      where: { id: productId, storeId: store.id },
      select: {
        name: true,
        description: true,
        price: true,
        unitType: true,
        imageUrl: true
      }
    });

    if (product) {
      const priceText = `R$ ${product.price.toFixed(2).replace(".", ",")}${product.unitType === "KG" ? "/kg" : ""}`;
      const productTitle = `${product.name} | ${store.name}`;
      const productDesc = product.description
        ? `${product.description.slice(0, 150)}... ${priceText} na ${store.name}. Peça já!`
        : `${product.name} por ${priceText} na ${store.name}. Confira e faça seu pedido direto pelo WhatsApp!`;

      const productImages = product.imageUrl
        ? [{ url: product.imageUrl, width: 800, height: 800, alt: product.name }]
        : store.logoUrl
        ? [{ url: store.logoUrl, width: 800, height: 800, alt: store.name }]
        : [];

      return {
        title: productTitle,
        description: productDesc,
        openGraph: {
          title: productTitle,
          description: productDesc,
          type: "website",
          siteName: store.name,
          images: productImages
        },
        twitter: {
          card: "summary_large_image",
          title: productTitle,
          description: productDesc,
          images: product.imageUrl ? [product.imageUrl] : store.logoUrl ? [store.logoUrl] : []
        }
      };
    }
  }

  // 2. Cenário: Página Principal da Loja
  const title =
    settings.seo.title || `${store.name} | Catálogo Online & Pedidos WhatsApp`;

  const description =
    settings.seo.description ||
    `Confira os produtos e faça seu pedido direto pelo WhatsApp com a ${store.name}.${
      store.address ? ` Endereço: ${store.address}.` : ""
    }`;

  const shareImageUrl = settings.seo.ogImageUrl || store.logoUrl;
  const images = shareImageUrl
    ? [{ url: shareImageUrl, width: 1200, height: 630, alt: store.name }]
    : [];

  const keywords = settings.seo.keywords
    ? settings.seo.keywords.split(",").map((k) => k.trim()).filter(Boolean)
    : undefined;

  return {
    title,
    description,
    keywords,
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
      images: shareImageUrl ? [shareImageUrl] : []
    }
  };
}

export default async function StorefrontPage({ params, searchParams }: Props) {
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

  const initialProductId = typeof searchParams?.p === "string" ? searchParams.p.trim() : undefined;

  // Estrutura de dados enriquecida para o Google (Schema.org)
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: store.name,
    description:
      serializedStore.settings.seo.description ||
      `Catálogo online e pedidos via WhatsApp da loja ${store.name}`,
    telephone: store.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address
    },
    ...(store.logoUrl ? { image: store.logoUrl } : {}),
    ...(serializedStore.settings.seo.ogImageUrl ? { logo: serializedStore.settings.seo.ogImageUrl } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Catálogo de Produtos - ${store.name}`,
      itemListElement: serializedProducts.slice(0, 30).map((p) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: p.name,
          description: p.description || p.name,
          ...(p.imageUrl ? { image: p.imageUrl } : {})
        },
        price: p.price,
        priceCurrency: "BRL",
        availability: p.isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
      }))
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <CatalogExperience
        slug={slug}
        initialStore={serializedStore as any}
        initialCategories={categories as any}
        initialProducts={serializedProducts as any}
        initialProductId={initialProductId}
      />
    </>
  );
}
