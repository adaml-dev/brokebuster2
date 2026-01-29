import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { MainLayoutClient } from "./layout-client";

/**
 * Wspólny layout dla wszystkich stron po zalogowaniu
 * Wymusza autoryzację i renderuje sidebar
 */
export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return (
    <MainLayoutClient userEmail={user.email || ""}>
      {children}
    </MainLayoutClient>
  );
}
