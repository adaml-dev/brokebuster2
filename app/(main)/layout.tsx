import { MainHeader } from "@/components/layout/MainHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/components/settings/SettingsContext";
import { getUserSettings } from "@/app/actions/settings-actions";

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

  // Fetch user settings
  const userSettings = await getUserSettings();
  const initialSettings = userSettings ? {
    showDashboard1: userSettings.show_dashboard1 ?? true,
    showDashboard2: userSettings.show_dashboard2 ?? true,
  } : undefined;

  return (
    <SettingsProvider initialSettings={initialSettings}>
      <div className="flex h-screen overflow-hidden bg-neutral-950 text-white">
        {/* Sidebar - fixed width on desktop, hidden on mobile by default */}
        {/* <div className="hidden md:flex w-64 flex-col border-r border-neutral-800">
          <Sidebar userEmail={user.email || ""} />
        </div> */}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <MainHeader userEmail={user.email || ""} title="Brokebuster" />
          <main className="flex-1 overflow-y-auto bg-neutral-950">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </SettingsProvider>
  );
}
