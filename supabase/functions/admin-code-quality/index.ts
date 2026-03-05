import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---------------------------------------------------------------------------
    // 1. Authenticate caller + verify admin
    // ---------------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user via their JWT
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin_settings table
    const { data: adminRow } = await supabase
      .from("admin_settings")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_admin", true)
      .maybeSingle();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden: not an admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---------------------------------------------------------------------------
    // 2. Fetch Netlify deploys
    // ---------------------------------------------------------------------------
    const netlifyToken = Deno.env.get("NETLIFY_API_TOKEN");
    const netlifySiteId = Deno.env.get("NETLIFY_SITE_ID");

    if (!netlifyToken || !netlifySiteId) {
      return new Response(
        JSON.stringify({ error: "Netlify credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const netlifyRes = await fetch(
      `https://api.netlify.com/api/v1/sites/${netlifySiteId}/deploys?per_page=30`,
      {
        headers: { Authorization: `Bearer ${netlifyToken}` },
      },
    );

    if (!netlifyRes.ok) {
      const errText = await netlifyRes.text();
      return new Response(
        JSON.stringify({ error: `Netlify API error: ${netlifyRes.status}`, detail: errText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const rawDeploys = await netlifyRes.json();

    // ---------------------------------------------------------------------------
    // 3. Shape response
    // ---------------------------------------------------------------------------
    const deploys = rawDeploys.map((d: any) => ({
      id: d.id,
      state: d.state, // ready, building, error, enqueued
      error_message: d.error_message || null,
      branch: d.branch || "unknown",
      commit_ref: d.commit_ref || null,
      commit_message: (d.title || "").slice(0, 120),
      committer: d.committer || null,
      deploy_time: d.deploy_time || null, // seconds
      created_at: d.created_at,
      published_at: d.published_at || null,
      deploy_url: d.deploy_ssl_url || d.deploy_url || null,
      context: d.context || "production", // production, deploy-preview, branch-deploy
      review_id: d.review_id || null,
    }));

    // Compute summary stats
    const completed = deploys.filter((d: any) => d.state === "ready" || d.state === "error");
    const successful = deploys.filter((d: any) => d.state === "ready");
    const failed = deploys.filter((d: any) => d.state === "error");

    const avgBuildTime =
      successful.length > 0
        ? Math.round(
            successful.reduce((s: number, d: any) => s + (d.deploy_time || 0), 0) /
              successful.length,
          )
        : 0;

    const last30d = deploys.filter((d: any) => {
      const created = new Date(d.created_at).getTime();
      return Date.now() - created < 30 * 24 * 60 * 60 * 1000;
    });

    const summary = {
      total_deploys: deploys.length,
      successful: successful.length,
      failed: failed.length,
      success_rate:
        completed.length > 0
          ? Math.round((successful.length / completed.length) * 100)
          : 100,
      avg_build_time_seconds: avgBuildTime,
      deploys_last_30d: last30d.length,
      last_deploy: deploys[0] || null,
    };

    return new Response(
      JSON.stringify({ deploys, summary }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
