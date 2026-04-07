import { CatalogExperience } from "@/components/vitrine/catalog-experience";

export default function StorefrontPage({
  params
}: {
  params: {
    slug: string;
  };
}) {
  return <CatalogExperience slug={params.slug} />;
}
