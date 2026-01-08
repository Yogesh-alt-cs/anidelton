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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    console.log("Received complaint:", JSON.stringify(body));

    const emailHtml = `
      <h1>🚨 New Complaint - ${body.issue_type}</h1>
      <p><strong>User:</strong> ${body.user_email || "Anonymous"}</p>
      <p><strong>Anime:</strong> ${body.anime_title || "N/A"} (Ep ${body.episode_number || "N/A"})</p>
      <p><strong>Device:</strong> ${body.device_info || "Unknown"}</p>
      <p><strong>Browser:</strong> ${body.browser_info || "Unknown"}</p>
      <p><strong>Description:</strong></p>
      <p style="background:#f5f5f5;padding:16px;border-radius:8px;">${body.description}</p>
    `;

    const emailPayload = {
      from: "AniDel <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🚨 Complaint: ${body.issue_type}`,
      html: emailHtml,
    };

    console.log("Sending email to:", ADMIN_EMAIL);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    const responseData = await emailResponse.json();
    console.log("Resend response:", JSON.stringify(responseData));

    if (!emailResponse.ok) {
      console.error("Resend error:", responseData);
      return new Response(
        JSON.stringify({ success: false, error: responseData.message || "Failed to send email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully");
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending complaint email:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
