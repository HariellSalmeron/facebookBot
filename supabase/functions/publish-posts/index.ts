import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const META_API_VERSION = "v18.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

async function publishPost(
  pageAccessToken: string,
  pageId: string,
  message: string
) {
  try {
    const response = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        access_token: pageAccessToken,
      }).toString(),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    throw new Error(
      `Post publishing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function processScheduledPosts() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const now = new Date();
  const { data: posts, error: fetchError } = await supabase
    .from("scheduled_posts")
    .select("*, facebook_pages!inner(page_id, page_access_token)")
    .eq("status", "pending")
    .lte("scheduled_time", now.toISOString())
    .order("scheduled_time", { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch scheduled posts: ${fetchError.message}`);
  }

  if (!posts || posts.length === 0) {
    return { published: 0, failed: 0 };
  }

  let published = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const page = post.facebook_pages;
      if (!page) {
        throw new Error("Page not found for post");
      }

      const result = await publishPost(
        page.page_access_token,
        page.page_id,
        post.content
      );

      const { error: updateError } = await supabase
        .from("scheduled_posts")
        .update({
          status: "published",
          facebook_post_id: result.id,
          published_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", post.id);

      if (updateError) {
        throw updateError;
      }

      const { error: logError } = await supabase
        .from("post_logs")
        .insert({
          user_id: post.user_id,
          page_id: post.page_id,
          content: post.content,
          facebook_post_id: result.id,
          status: "published",
          published_at: now.toISOString(),
        });

      if (logError) {
        console.error("Failed to log published post:", logError);
      }

      published++;
    } catch (error) {
      failed++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      const { error: updateError } = await supabase
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: errorMessage,
          updated_at: now.toISOString(),
        })
        .eq("id", post.id);

      if (updateError) {
        console.error("Failed to update post status:", updateError);
      }

      const { error: logError } = await supabase
        .from("post_logs")
        .insert({
          user_id: post.user_id,
          page_id: post.page_id,
          content: post.content,
          status: "failed",
          published_at: now.toISOString(),
        });

      if (logError) {
        console.error("Failed to log failed post:", logError);
      }
    }
  }

  return { published, failed };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const result = await processScheduledPosts();

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
