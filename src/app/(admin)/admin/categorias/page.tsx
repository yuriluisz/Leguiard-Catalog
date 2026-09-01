import { redirect } from "next/navigation";

export default function AdminCategoriesPage() {
  redirect("/admin/produtos?tab=categories");
}
