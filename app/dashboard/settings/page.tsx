import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApiKeysForm from "@/components/dashboard/ApiKeysForm";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-muted-foreground">
            Manage the API keys AutoFlow AI uses to run your AI nodes for real.
          </p>
        </div>

        <ApiKeysForm />
      </div>
    </DashboardLayout>
  );
}
