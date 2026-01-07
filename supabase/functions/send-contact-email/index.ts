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
      <h1>📬 Support Request</h1>
      <p><strong>From:</strong> ${body.email}</p>
      <p><strong>Subject:</strong> ${body.subject}</p>
      <p><strong>Message:</strong></p>
      <p style="background:#f5f5f5;padding:16px;">${body.message}</p>
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
        subject: `Support: ${body.subject}`,
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
