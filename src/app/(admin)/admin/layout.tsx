import { redirect } from "next/navigation";
import { resolveAdminStoreContext } from "@/lib/tenant";

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const context = await resolveAdminStoreContext();

  if (!context.ok) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen w-full bg-zinc-50/70 text-zinc-900 flex flex-col">
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
