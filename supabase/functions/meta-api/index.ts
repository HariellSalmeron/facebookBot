import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const META_API_VERSION = "v18.0";
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface RequestBody {
  action: string;
  access_token?: string;
  user_access_token?: string;
  page_access_token?: string;
  [key: string]: unknown;
}

async function exchangeCodeForToken(code: string, redirectUri: string, clientId: string, clientSecret: string) {
  try {
    const response = await fetch(`${META_GRAPH_URL}/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Token exchange failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function getUserPages(accessToken: string) {
  try {
    const response = await fetch(
      `${META_GRAPH_URL}/me/accounts?fields=id,name,picture.type(large)&access_token=${accessToken}`
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.data || [];
  } catch (error) {
    throw new Error(`Failed to fetch pages: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function publishPost(pageAccessToken: string, pageId: string, message: string) {
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
    throw new Error(`Post publishing failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function schedulePost(
  pageAccessToken: string,
  pageId: string,
  message: string,
  scheduledTime: number
) {
  try {
    const response = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        message,
        published: "false",
        scheduled_publish_time: scheduledTime.toString(),
        access_token: pageAccessToken,
      }).toString(),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Post scheduling failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function createPage(
  accessToken: string,
  name: string,
  category: string,
  about?: string
) {
  try {
    const params: Record<string, string> = {
      name,
      category_enum: category,
      access_token: accessToken,
    };

    if (about) {
      params.about = about;
    }

    const response = await fetch(`${META_GRAPH_URL}/me/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString(),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    throw new Error(`Page creation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { action } = body;

    let result;

    switch (action) {
      case "exchange_code": {
        const { code, redirectUri, clientId, clientSecret } = body;
        if (!code || !redirectUri || !clientId || !clientSecret) {
          throw new Error("Missing required parameters: code, redirectUri, clientId, clientSecret");
        }
        result = await exchangeCodeForToken(
          code as string,
          redirectUri as string,
          clientId as string,
          clientSecret as string
        );
        break;
      }

      case "get_pages": {
        const { access_token } = body;
        if (!access_token) {
          throw new Error("Missing required parameter: access_token");
        }
        result = await getUserPages(access_token as string);
        break;
      }

      case "publish_post": {
        const { page_access_token, pageId, message } = body;
        if (!page_access_token || !pageId || !message) {
          throw new Error("Missing required parameters: page_access_token, pageId, message");
        }
        result = await publishPost(page_access_token as string, pageId as string, message as string);
        break;
      }

      case "schedule_post": {
        const { page_access_token, pageId, message, scheduledTime } = body;
        if (!page_access_token || !pageId || !message || !scheduledTime) {
          throw new Error(
            "Missing required parameters: page_access_token, pageId, message, scheduledTime"
          );
        }
        result = await schedulePost(
          page_access_token as string,
          pageId as string,
          message as string,
          scheduledTime as number
        );
        break;
      }

      case "create_page": {
        const { access_token, name, category, about } = body;
        if (!access_token || !name || !category) {
          throw new Error("Missing required parameters: access_token, name, category");
        }
        result = await createPage(
          access_token as string,
          name as string,
          category as string,
          about as string | undefined
        );
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
