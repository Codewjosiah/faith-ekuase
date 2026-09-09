import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "../integrations/supabase/auth-middleware";

type Claims = { email?: unknown };

export const bootstrapInitialAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = String((context.claims as Claims).email ?? "").toLowerCase();
    if (email !== "faithekuase1@gmail.com") {
      return { ok: false, reason: "not_allowed" as const };
    }

    const { supabaseAdmin } = await import("../integrations/supabase/client.server");
    const { count, error: countError } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) throw countError;
    if ((count ?? 0) > 0) return { ok: false, reason: "already_claimed" as const };

    const { error } = await supabaseAdmin.from("user_roles").insert({
      user_id: context.userId,
      role: "admin",
    });

    if (error && error.code !== "23505") throw error;
    return { ok: true, reason: "claimed" as const };
  });

export const resolveCmsMedia = createServerFn({ method: "POST" })
  .inputValidator((input: { urls: string[] }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("../integrations/supabase/client.server");
    const resolved = await Promise.all(
      data.urls.map(async (url) => {
        if (!url.startsWith("storage://cms-media/")) return url;
        const path = url.replace("storage://cms-media/", "");
        const { data: signed, error } = await supabaseAdmin.storage
          .from("cms-media")
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        return error || !signed?.signedUrl ? url : signed.signedUrl;
      }),
    );

    return resolved;
  });