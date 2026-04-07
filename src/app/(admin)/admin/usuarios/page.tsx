import { redirect } from "next/navigation";

import { UsersManager } from "@/components/admin/users-manager";
import { resolveAdminStoreContext } from "@/lib/tenant";

export default async function AdminUsersPage() {
  const context = await resolveAdminStoreContext();

  if (!context.ok) {
    redirect("/login");
  }

  if (!context.isSystemAdmin) {
    redirect("/admin");
  }

  return <UsersManager />;
}
