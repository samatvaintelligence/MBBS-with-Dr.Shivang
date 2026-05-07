import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar user={session.user} />
      <main className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
