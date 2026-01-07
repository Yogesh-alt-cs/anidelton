const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Subscription {
  user_id: string;
  anime_id: number;
  anime_title: string;
  last_notified_episode: number;
}

interface JikanEpisode {
  mal_id: number;
  title: string;
  aired: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("Starting new episode check job...");

    // Fetch all active subscriptions
    const subsResponse = await fetch(
      `${supabaseUrl}/rest/v1/notification_subscriptions?enabled=eq.true&select=user_id,anime_id,anime_title,last_notified_episode`,
      {
        headers: {
          "apikey": supabaseServiceKey,
          "Authorization": `Bearer ${supabaseServiceKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!subsResponse.ok) {
      throw new Error(`Failed to fetch subscriptions: ${subsResponse.status}`);
    }

    const subscriptions: Subscription[] = await subsResponse.json();

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active subscriptions found");
      return new Response(JSON.stringify({ message: "No subscriptions to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group subscriptions by anime_id to avoid duplicate API calls
    const animeSubscriptions = new Map<number, Subscription[]>();
    for (const sub of subscriptions) {
      const existing = animeSubscriptions.get(sub.anime_id) || [];
      existing.push(sub);
      animeSubscriptions.set(sub.anime_id, existing);
    }

    console.log(`Processing ${animeSubscriptions.size} unique anime...`);

    let notificationsSent = 0;
    const processedAnime: number[] = [];

    for (const [animeId, subs] of animeSubscriptions) {
      try {
        // Rate limit: wait 400ms between API calls to respect Jikan's limits
        if (processedAnime.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }

        // Fetch latest episodes from Jikan API
        const response = await fetch(
          `https://api.jikan.moe/v4/anime/${animeId}/episodes?page=1`
        );

        if (!response.ok) {
          console.error(`Failed to fetch episodes for anime ${animeId}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const episodes: JikanEpisode[] = data.data || [];

        if (episodes.length === 0) {
          continue;
        }

        // Find the latest episode number
        const latestEpisodeNum = Math.max(...episodes.map((ep) => ep.mal_id));

        // Process each subscriber
        for (const sub of subs) {
          const lastNotified = sub.last_notified_episode || 0;

          if (latestEpisodeNum > lastNotified) {
            // Get new episodes we haven't notified about
            const newEpisodes = episodes.filter((ep) => ep.mal_id > lastNotified);

            for (const episode of newEpisodes) {
              // Insert notification using REST API
              const notifResponse = await fetch(
                `${supabaseUrl}/rest/v1/anime_notifications`,
                {
                  method: "POST",
                  headers: {
                    "apikey": supabaseServiceKey,
                    "Authorization": `Bearer ${supabaseServiceKey}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                  },
                  body: JSON.stringify({
                    user_id: sub.user_id,
                    anime_id: animeId,
                    anime_title: sub.anime_title,
                    episode_number: episode.mal_id,
                    message: `Episode ${episode.mal_id} of ${sub.anime_title} is now available!`,
                    is_read: false,
                  }),
                }
              );

              if (notifResponse.ok) {
                notificationsSent++;
              } else {
                console.log(`Notification insert failed: ${notifResponse.status}`);
              }
            }

            // Update last notified episode
            await fetch(
              `${supabaseUrl}/rest/v1/notification_subscriptions?user_id=eq.${sub.user_id}&anime_id=eq.${animeId}`,
              {
                method: "PATCH",
                headers: {
                  "apikey": supabaseServiceKey,
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                  "Content-Type": "application/json",
                  "Prefer": "return=minimal",
                },
                body: JSON.stringify({ last_notified_episode: latestEpisodeNum }),
              }
            );
          }
        }

        // Track that we've processed this anime/episode combo
        await fetch(
          `${supabaseUrl}/rest/v1/sent_notification_tracking`,
          {
            method: "POST",
            headers: {
              "apikey": supabaseServiceKey,
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json",
              "Prefer": "resolution=merge-duplicates",
            },
            body: JSON.stringify({
              anime_id: animeId,
              episode_number: latestEpisodeNum,
              notification_type: "new_episode",
            }),
          }
        );

        processedAnime.push(animeId);
      } catch (animeError) {
        console.error(`Error processing anime ${animeId}:`, animeError);
        continue;
      }
    }

    console.log(`Job complete. Sent ${notificationsSent} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        processedAnime: processedAnime.length,
        notificationsSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in check-new-episodes:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
