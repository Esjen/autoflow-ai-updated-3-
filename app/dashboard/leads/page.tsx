import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LeadsView from "@/components/dashboard/LeadsView";

export default async function LeadsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <LeadsView />
    </DashboardLayout>
  );
}
