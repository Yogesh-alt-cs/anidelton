// Streaming utilities for Vidwish, Megaplay, and other sources
// Provides reliable video streaming with fallbacks

export type StreamServer = 'vidwish' | 'megaplay' | 'filemoon' | 'doodstream' | 'embtaku' | 'gogoanime';

export interface StreamSource {
  server: StreamServer;
  embedUrl: string;
  directUrl?: string;
  quality?: string;
  priority: number;
}

// Generate clean slug from anime title
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
};

// Generate episode ID from anime slug
export const generateEpisodeId = (slug: string, episode: number, isDub = false): string => {
  const dubSuffix = isDub ? '-dub' : '';
  return `${slug}${dubSuffix}-episode-${episode}`;
};

// Get all available embed URLs for an episode
export const getStreamSources = (
  animeTitle: string,
  episode: number,
  isDub = false
): StreamSource[] => {
  const slug = generateSlug(animeTitle);
  const episodeId = generateEpisodeId(slug, episode, isDub);

  return [
    // Primary - Vidwish (Streamwish) - Usually most reliable
    {
      server: 'vidwish',
      embedUrl: `https://streamwish.to/e/${episodeId}`,
      priority: 1,
    },
    // Vidwish alternative domain
    {
      server: 'vidwish',
      embedUrl: `https://swdyu.com/e/${episodeId}`,
      priority: 2,
    },
    // Megaplay / Megacloud
    {
      server: 'megaplay',
      embedUrl: `https://megacloud.tv/embed-2/e-1/${episodeId}?autoPlay=1`,
      priority: 3,
    },
    {
      server: 'megaplay',
      embedUrl: `https://megacloud.club/embed/${episodeId}`,
      priority: 4,
    },
    // Filemoon backup
    {
      server: 'filemoon',
      embedUrl: `https://filemoon.sx/e/${episodeId}`,
      priority: 5,
    },
    // Doodstream backup
    {
      server: 'doodstream',
      embedUrl: `https://doodstream.com/e/${episodeId}`,
      priority: 6,
    },
    // Embtaku (Gogoanime-based)
    {
      server: 'embtaku',
      embedUrl: `https://embtaku.pro/streaming.php?id=${episodeId}`,
      priority: 7,
    },
    // Original Gogoanime embed
    {
      server: 'gogoanime',
      embedUrl: `https://gogoanime.gg/videos/${episodeId}`,
      priority: 8,
    },
  ];
};

// Get primary embed URL
export const getPrimaryEmbedUrl = (
  animeTitle: string,
  episode: number,
  isDub = false
): string => {
  const sources = getStreamSources(animeTitle, episode, isDub);
  return sources[0]?.embedUrl || '';
};

// Get fallback embed URLs
export const getFallbackEmbedUrls = (
  animeTitle: string,
  episode: number,
  isDub = false
): string[] => {
  const sources = getStreamSources(animeTitle, episode, isDub);
  return sources.slice(1).map(s => s.embedUrl);
};

// Get embed URL for specific server
export const getServerEmbedUrl = (
  animeTitle: string,
  episode: number,
  server: StreamServer,
  isDub = false
): string => {
  const sources = getStreamSources(animeTitle, episode, isDub);
  return sources.find(s => s.server === server)?.embedUrl || sources[0]?.embedUrl || '';
};

// Available servers for UI
export const AVAILABLE_SERVERS: { id: StreamServer; name: string; description: string }[] = [
  { id: 'vidwish', name: 'Vidwish', description: 'Primary server - Fast & reliable' },
  { id: 'megaplay', name: 'Megaplay', description: 'Backup server - Good quality' },
  { id: 'filemoon', name: 'Filemoon', description: 'Alternative - Stable' },
  { id: 'doodstream', name: 'Doodstream', description: 'Fallback - Wide availability' },
  { id: 'embtaku', name: 'Embtaku', description: 'Gogoanime-based' },
];

// Consumet API utilities with multiple fallback servers
const CONSUMET_SERVERS = [
  'https://api.consumet.org',
  'https://consumet-api.vercel.app',
  'https://consumet-jade.vercel.app',
];

// CORS proxies for fallback
const CORS_PROXIES = [
  '', // Try direct first
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

export const fetchFromConsumet = async (endpoint: string): Promise<any> => {
  let lastError: Error | null = null;

  for (const baseUrl of CONSUMET_SERVERS) {
    for (const proxy of CORS_PROXIES) {
      try {
        const url = proxy 
          ? `${proxy}${encodeURIComponent(`${baseUrl}${endpoint}`)}`
          : `${baseUrl}${endpoint}`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const text = await response.text();
          try {
            return JSON.parse(text);
          } catch {
            // Try to extract JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0]);
            }
          }
        }
      } catch (err) {
        lastError = err as Error;
        continue;
      }
    }
  }

  throw lastError || new Error('All Consumet servers failed');
};

// Search anime on Consumet
export const searchAnimeOnConsumet = async (query: string): Promise<any[]> => {
  try {
    const data = await fetchFromConsumet(`/anime/gogoanime/${encodeURIComponent(query)}`);
    return data.results || [];
  } catch {
    return [];
  }
};

// Get anime info from Consumet
export const getAnimeInfoFromConsumet = async (animeId: string): Promise<any | null> => {
  try {
    const data = await fetchFromConsumet(`/anime/gogoanime/info/${encodeURIComponent(animeId)}`);
    return data;
  } catch {
    return null;
  }
};

// Get episode sources from Consumet
export const getEpisodeSourcesFromConsumet = async (episodeId: string): Promise<any | null> => {
  try {
    const data = await fetchFromConsumet(`/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`);
    return data;
  } catch {
    return null;
  }
};

// Select best quality source
export const selectBestQualitySource = (sources: any[]): any | null => {
  if (!sources || sources.length === 0) return null;

  const qualityOrder = ['1080p', '720p', '480p', '360p', 'default', 'backup', 'auto'];

  const sorted = [...sources].sort((a, b) => {
    const aQuality = a.quality?.toLowerCase() || '';
    const bQuality = b.quality?.toLowerCase() || '';
    const aIndex = qualityOrder.findIndex(q => aQuality.includes(q));
    const bIndex = qualityOrder.findIndex(q => bQuality.includes(q));
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  return sorted[0];
};
