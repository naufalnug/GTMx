import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export async function getPortalViewer() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;

  const isAdmin = claims.app_metadata?.portal_role === "admin";
  if (isAdmin)
    return { id: claims.sub, email: claims.email, isAdmin, client: null };

  const { data: membership } = await supabase
    .from("portal_memberships")
    .select("client_slug, clients(*)")
    .eq("user_id", claims.sub)
    .maybeSingle();
  const client = membership?.clients;
  if (!client?.active)
    return {
      id: claims.sub,
      email: claims.email,
      isAdmin: false,
      client: null,
    };
  return { id: claims.sub, email: claims.email, isAdmin: false, client };
}

export async function requirePortalClient(previewClientSlug) {
  const viewer = await getPortalViewer();
  if (!viewer) redirect("/portal/login");
  if (viewer.isAdmin) {
    if (!previewClientSlug) redirect("/portal-admin");
    const { data: client } = await createAdminClient()
      .from("clients")
      .select("*")
      .eq("slug", previewClientSlug)
      .maybeSingle();
    if (!client) redirect("/portal-admin?error=client-not-found");
    return { ...viewer, client, isPreview: true };
  }
  if (!viewer.client) redirect("/portal/login?error=access");
  return { ...viewer, isPreview: false };
}

export async function requirePortalAdmin() {
  const viewer = await getPortalViewer();
  if (!viewer) redirect("/portal/login");
  if (!viewer.isAdmin) redirect("/portal");
  return viewer;
}
