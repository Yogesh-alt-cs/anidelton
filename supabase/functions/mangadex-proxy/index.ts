const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MANGADEX_API = "https://api.mangadex.org";

type ProxyParams = Record<string, string | number | boolean | Array<string | number | boolean> | null | undefined>;

type ProxyRequestBody = {
  path: string;
  params?: ProxyParams;
};

const isValidPath = (path: string) => {
  if (!path || typeof path !== "string") return false;
  if (!path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  // allow /manga/<uuid>/feed etc.
  return /^\/[A-Za-z0-9\-\/]+$/.test(path);
};

const buildSearchParams = (params?: ProxyParams) => {
  const sp = new URLSearchParams();
  if (!params) return sp;

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      for (const v of value) {
        sp.append(key, String(v));
      }
    } else {
      sp.append(key, String(value));
    }
  }

  return sp;
};

const fetchWithRetry = async (url: string, attempts = 3) => {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "AniDel/1.0 (Lovable Cloud)",
        },
      });
      return res;
    } catch (e) {
      lastError = e;
      const delay = 250 * Math.pow(2, i);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Fetch failed");
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json().catch(() => null)) as ProxyRequestBody | null;

    const path = body?.path;
    const params = body?.params;

    if (!path || !isValidPath(path)) {
      return new Response(JSON.stringify({ error: "Invalid path" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const target = new URL(`${MANGADEX_API}${path}`);
    const sp = buildSearchParams(params);
    sp.forEach((v, k) => target.searchParams.append(k, v));

    const started = Date.now();
    const res = await fetchWithRetry(target.toString(), 3);
    const durationMs = Date.now() - started;

    const contentType = res.headers.get("content-type") ?? "application/json";
    const text = await res.text();

    if (!res.ok) {
      console.error("MangaDex proxy error", {
        path,
        status: res.status,
        durationMs,
        body: text?.slice?.(0, 500) ?? "",
      });
    }

    // Keep responses cacheable but not too long (results change frequently)
    return new Response(text, {
      status: res.status,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("mangadex-proxy unexpected error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
