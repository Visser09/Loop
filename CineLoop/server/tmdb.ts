import type { Title } from "@shared/schema";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

interface TMDBTitle {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  vote_average: number;
  runtime?: number;
  episode_run_time?: number[];
  media_type?: "movie" | "tv";
}

interface TMDBCredits {
  cast: Array<{
    name: string;
    character: string;
    order: number;
  }>;
  crew: Array<{
    name: string;
    job: string;
    department: string;
  }>;
}

interface TMDBGenre {
  id: number;
  name: string;
}

interface TMDBConfiguration {
  images: {
    base_url: string;
    poster_sizes: string[];
    backdrop_sizes: string[];
  };
}

class TMDBService {
  private apiKey: string | undefined;
  private genreCache: Map<number, string> = new Map();
  private configCache: TMDBConfiguration | null = null;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error("TMDB_API_KEY is not set. TMDB service is unavailable.");
    }

    const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
    url.searchParams.set("api_key", this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getConfiguration(): Promise<TMDBConfiguration> {
    if (this.configCache) {
      return this.configCache;
    }

    this.configCache = await this.makeRequest<TMDBConfiguration>("/configuration");
    return this.configCache;
  }

  async loadGenres(): Promise<void> {
    if (!this.apiKey) return; // Skip if API key is not set

    const [movieGenres, tvGenres] = await Promise.all([
      this.makeRequest<{ genres: TMDBGenre[] }>("/genre/movie/list"),
      this.makeRequest<{ genres: TMDBGenre[] }>("/genre/tv/list")
    ]);

    [...movieGenres.genres, ...tvGenres.genres].forEach(genre => {
      this.genreCache.set(genre.id, genre.name);
    });
  }

  private getGenreNames(genreIds: number[]): string[] {
    return genreIds.map(id => this.genreCache.get(id)).filter(Boolean) as string[];
  }

  private getImageUrl(path: string | null, size: string = "w500"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}/${size}${path}`;
  }

  private async getCredits(id: number, type: "movie" | "tv"): Promise<TMDBCredits> {
    if (!this.apiKey) {
      return { cast: [], crew: [] }; // Return empty if not available
    }
    return this.makeRequest<TMDBCredits>(`/${type}/${id}/credits`);
  }

  private convertToTitle(tmdbTitle: TMDBTitle, type: "movie" | "tv", credits?: TMDBCredits): Partial<Title> {
    const name = tmdbTitle.title || tmdbTitle.name || "";
    const year = tmdbTitle.release_date 
      ? new Date(tmdbTitle.release_date).getFullYear()
      : tmdbTitle.first_air_date 
        ? new Date(tmdbTitle.first_air_date).getFullYear()
        : null;

    const runtime = type === "movie" 
      ? tmdbTitle.runtime 
      : tmdbTitle.episode_run_time?.[0];

    const cast = credits?.cast
      .sort((a, b) => a.order - b.order)
      .slice(0, 10)
      .map(person => person.name) || [];

    const crew = credits?.crew
      .filter(person => ["Director", "Writer", "Creator"].includes(person.job))
      .map(person => person.name) || [];

    return {
      externalId: tmdbTitle.id.toString(),
      name,
      type,
      year,
      genres: this.getGenreNames(tmdbTitle.genre_ids),
      synopsis: tmdbTitle.overview,
      posterUrl: this.getImageUrl(tmdbTitle.poster_path),
      backdropUrl: this.getImageUrl(tmdbTitle.backdrop_path, "w1280"),
      runtime,
      cast,
      crew,
      rating: Math.round(tmdbTitle.vote_average * 10) / 10,
    };
  }

  async getTrending(timeWindow: "day" | "week" = "day"): Promise<Partial<Title>[]> {
    if (!this.apiKey) return []; // Return empty if not available

    const response = await this.makeRequest<{ results: TMDBTitle[] }>(`/trending/all/${timeWindow}`);

    return Promise.all(
      response.results.slice(0, 20).map(async (tmdbTitle) => {
        const type = tmdbTitle.media_type === "tv" ? "tv" : "movie";
        const credits = await this.getCredits(tmdbTitle.id, type);
        return this.convertToTitle(tmdbTitle, type, credits);
      })
    );
  }

  async getPopular(type: "movie" | "tv"): Promise<Partial<Title>[]> {
    if (!this.apiKey) return []; // Return empty if not available

    const response = await this.makeRequest<{ results: TMDBTitle[] }>(`/${type}/popular`);

    return Promise.all(
      response.results.slice(0, 20).map(async (tmdbTitle) => {
        const credits = await this.getCredits(tmdbTitle.id, type);
        return this.convertToTitle(tmdbTitle, type, credits);
      })
    );
  }

  async getTopRated(type: "movie" | "tv"): Promise<Partial<Title>[]> {
    if (!this.apiKey) return []; // Return empty if not available

    const response = await this.makeRequest<{ results: TMDBTitle[] }>(`/${type}/top_rated`);

    return Promise.all(
      response.results.slice(0, 20).map(async (tmdbTitle) => {
        const credits = await this.getCredits(tmdbTitle.id, type);
        return this.convertToTitle(tmdbTitle, type, credits);
      })
    );
  }

  async searchTitles(query: string): Promise<Partial<Title>[]> {
    if (!this.apiKey) return []; // Return empty if not available

    const response = await this.makeRequest<{ results: TMDBTitle[] }>("/search/multi", {
      query: encodeURIComponent(query)
    });

    return Promise.all(
      response.results
        .filter(result => result.media_type === "movie" || result.media_type === "tv")
        .slice(0, 20)
        .map(async (tmdbTitle) => {
          const type = tmdbTitle.media_type === "tv" ? "tv" : "movie";
          const credits = await this.getCredits(tmdbTitle.id, type);
          return this.convertToTitle(tmdbTitle, type, credits);
        })
    );
  }

  async getTitle(id: number, type: "movie" | "tv"): Promise<Partial<Title> | null> {
    if (!this.apiKey) return null; // Return null if not available

    try {
      const [tmdbTitle, credits] = await Promise.all([
        this.makeRequest<TMDBTitle>(`/${type}/${id}`),
        this.getCredits(id, type)
      ]);

      return this.convertToTitle(tmdbTitle, type, credits);
    } catch (error) {
      console.error(`Error fetching TMDB title ${id}:`, error);
      return null;
    }
  }

  async getSimilar(id: number, type: "movie" | "tv"): Promise<Partial<Title>[]> {
    if (!this.apiKey) return []; // Return empty if not available

    const response = await this.makeRequest<{ results: TMDBTitle[] }>(`/${type}/${id}/similar`);

    return Promise.all(
      response.results.slice(0, 10).map(async (tmdbTitle) => {
        const credits = await this.getCredits(tmdbTitle.id, type);
        return this.convertToTitle(tmdbTitle, type, credits);
      })
    );
  }
}

export const tmdbService = new TMDBService();

// Initialize genres on startup if TMDB_API_KEY is set
if (process.env.TMDB_API_KEY) {
  tmdbService.loadGenres().catch(console.error);
}