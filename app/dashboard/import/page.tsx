import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import ImportPageClient from "./ImportPageClient";

export default async function ImportPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  return <ImportPageClient userEmail={user.email || ""} />;
}
