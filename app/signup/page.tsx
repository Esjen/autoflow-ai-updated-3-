import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AuthCard from "@/components/auth/AuthCard";
import SignupForm from "@/components/auth/SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-muted/30 to-muted/60 px-6">
      <AuthCard
        title="Create Account"
        description="Start automating your business with AutoFlow AI."
      >
        <SignupForm />
      </AuthCard>
    </main>
  );
}