const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;

  try {
    const u = new URL(url);
    // Only allow MangaDex image CDN domains
    const allowed = [
      "uploads.mangadex.org",
      "cmdxd98sb0x3yprd.mangadex.network",
    ];
    // MangaDex uses dynamic CDN subdomains like *.mangadex.network
    const isMangaDexCDN = u.hostname.endsWith(".mangadex.network") || u.hostname.endsWith(".mangadex.org");
    const isAllowed = allowed.includes(u.hostname) || isMangaDexCDN;
    return isAllowed && (u.protocol === "https:" || u.protocol === "http:");
  } catch {
    return false;
  }
};

const fetchImageWithRetry = async (url: string, attempts = 3): Promise<Response> => {
  let lastError: unknown;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "AniDel/1.0 (Lovable Cloud)",
          Accept: "image/*",
          Referer: "https://mangadex.org/",
        },
      });

      if (res.ok) {
        return res;
      }

      // If 403/429, wait and retry
      if (res.status === 403 || res.status === 429) {
        const delay = 500 * Math.pow(2, i);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      // For other errors, don't retry
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

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const imageUrl = url.searchParams.get("url");

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decodedUrl = decodeURIComponent(imageUrl);

    if (!isValidImageUrl(decodedUrl)) {
      console.error("Invalid image URL rejected:", decodedUrl);
      return new Response(JSON.stringify({ error: "Invalid or disallowed URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageRes = await fetchImageWithRetry(decodedUrl, 3);

    if (!imageRes.ok) {
      console.error("Image fetch failed:", { url: decodedUrl, status: imageRes.status });
      return new Response(JSON.stringify({ error: `Upstream error: ${imageRes.status}` }), {
        status: imageRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const imageBody = imageRes.body;

    return new Response(imageBody, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("manga-image-proxy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
