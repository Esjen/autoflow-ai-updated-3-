import { createClient } from "@/lib/supabase/client";
import type { ApiKeyProvider, UserApiKey } from "@/lib/types/workflow";

const supabase = createClient();

export async function getApiKeys(): Promise<UserApiKey[]> {
  const { data, error } = await supabase.from("user_api_keys").select("*");

  if (error) {
    console.error("Failed to fetch API keys:", error);
    return [];
  }

  return data ?? [];
}

export async function upsertApiKey(provider: ApiKeyProvider, keyValue: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase
    .from("user_api_keys")
    .upsert(
      { user_id: user.id, provider, key_value: keyValue },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    console.error("Failed to save API key:", error);
    throw new Error(error.message);
  }
}

export async function deleteApiKey(provider: ApiKeyProvider) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated.");

  const { error } = await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) {
    console.error("Failed to delete API key:", error);
    throw new Error(error.message);
  }
}

/** Masks a key for display, e.g. sk-live-••••••••1234 */
export function maskKey(key: string) {
  if (key.length <= 6) return "•".repeat(key.length);
  return `${key.slice(0, 4)}${"•".repeat(Math.max(4, key.length - 8))}${key.slice(-4)}`;
}
