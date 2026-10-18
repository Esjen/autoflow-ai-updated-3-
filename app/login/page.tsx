import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <AuthCard
        title="Welcome Back"
        description="Sign in to continue to AutoFlow AI."
      >
        <LoginForm />
      </AuthCard>
    </main>
  );
}