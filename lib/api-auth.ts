import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/billing/server";

export type AppRole = "superadmin" | "company_admin" | "guard" | "host";

export type AuthenticatedProfile = {
  id: string;
  company_id: string | null;
  role: AppRole;
  full_name?: string | null;
  email?: string | null;
};

export type AuthenticatedRequest = {
  user: User;
  profile: AuthenticatedProfile;
  supabaseAdmin: SupabaseClient;
};

const ROLE_ALIASES: Record<string, AppRole> = {
  superadmin: "superadmin",
  super_admin: "superadmin",
  company_admin: "company_admin",
  "company-admin": "company_admin",
  guard: "guard",
  host: "host",
};

export function normalizeRole(role?: string | null): AppRole | null {
  return ROLE_ALIASES[String(role || "").trim().toLowerCase()] || null;
}

function bearerTokenFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

export async function requireAuthenticatedRequest(request: Request): Promise<AuthenticatedRequest> {
  const token = bearerTokenFromRequest(request);
  if (!token) throw Object.assign(new Error("Unauthorized request."), { status: 401 });

  let user: User | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabaseAnon.auth.getUser(token);
    if (!authError && authData.user) {
      user = authData.user;
    }
  }

  // Fallback for JWT parsing when running standalone or with custom auth / Neon
  if (!user) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
        user = {
          id: payload.sub || payload.id || "user-session",
          email: payload.email,
          user_metadata: payload.user_metadata || {},
          app_metadata: payload.app_metadata || {},
          aud: payload.aud || "authenticated",
          created_at: new Date().toISOString(),
        } as unknown as User;
      }
    } catch {
      // not a JWT
    }
  }

  if (!user) {
    throw Object.assign(new Error("Unauthorized request."), { status: 401 });
  }

  const authData = { user };

  const supabaseAdmin = createSupabaseAdmin();
  let { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, company_id, role, full_name, email")
    .eq("id", authData.user.id)
    .maybeSingle();

  // Self-heal: If profile is missing, resolve from user_metadata or hosts table
  if (!profile) {
    const meta = authData.user.user_metadata || {};
    let resolvedRole = meta.role ? String(meta.role).trim().toLowerCase() : null;
    let resolvedCompanyId = meta.companyId || meta.company_id || null;
    let resolvedFullName = meta.name || meta.full_name || null;

    if (!resolvedCompanyId || resolvedRole === "host" || !resolvedRole) {
      const { data: matchedHost } = await supabaseAdmin
        .from("hosts")
        .select("id, company_id, name")
        .or(`user_id.eq.${authData.user.id},email.ilike.${authData.user.email || "NONE"}`)
        .maybeSingle();

      if (matchedHost) {
        resolvedRole = resolvedRole || "host";
        resolvedCompanyId = resolvedCompanyId || matchedHost.company_id;
        resolvedFullName = resolvedFullName || matchedHost.name;

        // Auto-link host user_id
        await supabaseAdmin
          .from("hosts")
          .update({ user_id: authData.user.id })
          .eq("id", matchedHost.id);
      }
    }

    if (resolvedRole) {
      // Attempt to persist in profiles table
      try {
        const { data: createdProfile } = await supabaseAdmin
          .from("profiles")
          .upsert(
            {
              id: authData.user.id,
              company_id: resolvedCompanyId,
              role: resolvedRole,
              full_name: resolvedFullName || authData.user.email || "User",
              email: authData.user.email || null,
            },
            { onConflict: "id" }
          )
          .select("id, company_id, role, full_name, email")
          .maybeSingle();

        if (createdProfile) {
          profile = createdProfile;
        }
      } catch (insertErr) {
        console.warn("Could not insert profile into profiles table:", insertErr);
      }

      // If DB upsert failed (e.g. enum issue in Postgres), fallback to resolved in-memory profile
      if (!profile) {
        profile = {
          id: authData.user.id,
          company_id: resolvedCompanyId,
          role: resolvedRole,
          full_name: resolvedFullName || authData.user.email || "User",
          email: authData.user.email || null,
        };
      }
    }
  }

  const normalizedRole = normalizeRole(profile?.role);
  if (!profile || !normalizedRole) {
    throw Object.assign(new Error("Unauthorized request."), { status: 401 });
  }

  return {
    user: authData.user,
    profile: {
      id: profile.id,
      company_id: profile.company_id,
      role: normalizedRole,
      full_name: profile.full_name,
      email: profile.email,
    },
    supabaseAdmin,
  };
}

export async function requireRole(request: Request, allowedRoles: AppRole[]) {
  const auth = await requireAuthenticatedRequest(request);
  if (!allowedRoles.includes(auth.profile.role)) {
    throw Object.assign(new Error("Unauthorized request."), { status: 403 });
  }
  return auth;
}

export function assertCompanyAccess(profile: AuthenticatedProfile, companyId: string) {
  if (profile.role === "superadmin") return;
  if (!profile.company_id || profile.company_id !== companyId) {
    throw Object.assign(new Error("Unauthorized request."), { status: 403 });
  }
}

export function getSafeErrorResponse(error: unknown, fallback = "Request could not be completed.") {
  const status = typeof error === "object" && error && "status" in error ? Number((error as { status?: number }).status) : 500;
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
  const message = safeStatus >= 500 ? fallback : error instanceof Error ? error.message : fallback;
  return { message, status: safeStatus };
}