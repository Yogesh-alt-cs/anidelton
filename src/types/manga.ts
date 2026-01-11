export interface Manga {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  status: string;
  releaseDate: number | null;
  contentRating: string;
  lastVolume: string | null;
  lastChapter: string | null;
  image: string;
  genres: string[];
  themes: string[];
  authors: string[];
  artists: string[];
}

export interface MangaChapter {
  id: string;
  title: string;
  chapterNumber: string;
  volumeNumber: string | null;
  pages: number;
  translatedLanguage: string;
  publishAt: string;
  readableAt: string;
  scanlationGroup: string | null;
}

export interface MangaPage {
  page: number;
  img: string;
}

export interface MangaSearchResult {
  id: string;
  title: string;
  image: string;
  status: string;
  contentRating: string;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  page: number;
  timestamp: number;
}
