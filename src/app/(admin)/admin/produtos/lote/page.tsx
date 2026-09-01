import { redirect } from "next/navigation";

export default function AdminBatchPage() {
  redirect("/admin/produtos?tab=batch");
}
