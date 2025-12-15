export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  images: {
    jpg: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
    webp: {
      image_url: string;
      small_image_url: string;
      large_image_url: string;
    };
  };
  trailer: {
    youtube_id: string | null;
    url: string | null;
    embed_url: string | null;
  };
  synopsis: string | null;
  type: string;
  episodes: number | null;
  status: string;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  members: number | null;
  favorites: number | null;
  year: number | null;
  season: string | null;
  studios: { mal_id: number; name: string }[];
  genres: { mal_id: number; name: string }[];
  themes: { mal_id: number; name: string }[];
  demographics: { mal_id: number; name: string }[];
  duration: string;
  rating: string;
  aired: {
    from: string;
    to: string | null;
    string: string;
  };
}

export interface AnimeSearchResponse {
  data: Anime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
  };
}

export interface Episode {
  mal_id: number;
  url: string;
  title: string;
  title_japanese: string | null;
  title_romanji: string | null;
  aired: string;
  score: number | null;
  filler: boolean;
  recap: boolean;
}

export interface WatchlistItem {
  anime: Anime;
  status: 'watching' | 'completed' | 'plan_to_watch' | 'dropped';
  progress: number;
  addedAt: Date;
}

export interface Genre {
  mal_id: number;
  name: string;
  count: number;
}

export const GENRES: Genre[] = [
  { mal_id: 1, name: 'Action', count: 0 },
  { mal_id: 2, name: 'Adventure', count: 0 },
  { mal_id: 4, name: 'Comedy', count: 0 },
  { mal_id: 8, name: 'Drama', count: 0 },
  { mal_id: 10, name: 'Fantasy', count: 0 },
  { mal_id: 14, name: 'Horror', count: 0 },
  { mal_id: 7, name: 'Mystery', count: 0 },
  { mal_id: 22, name: 'Romance', count: 0 },
  { mal_id: 24, name: 'Sci-Fi', count: 0 },
  { mal_id: 36, name: 'Slice of Life', count: 0 },
  { mal_id: 30, name: 'Sports', count: 0 },
  { mal_id: 37, name: 'Supernatural', count: 0 },
];
