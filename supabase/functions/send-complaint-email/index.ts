const ADMIN_EMAIL = "yogesh29036@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
    const body = await req.json();

    const emailHtml = `
      <h1>🚨 New Complaint - ${body.issue_type}</h1>
      <p><strong>User:</strong> ${body.user_email || "Anonymous"}</p>
      <p><strong>Anime:</strong> ${body.anime_title || "N/A"} (Ep ${body.episode_number || "N/A"})</p>
      <p><strong>Device:</strong> ${body.device_info || "Unknown"}</p>
      <p><strong>Description:</strong></p>
      <p style="background:#f5f5f5;padding:16px;">${body.description}</p>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "AniDel <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `Complaint: ${body.issue_type}`,
        html: emailHtml,
      }),
    });

    return new Response(
      JSON.stringify({ success: emailResponse.ok }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
