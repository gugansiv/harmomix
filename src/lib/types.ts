export type Source = "spotify" | "youtube";

export interface UnifiedTrack {
  id: string;
  source: Source;
  title: string;
  artist: string;
  album?: string;
  durationMs?: number;
  artworkUrl?: string;
  // source-specific identifiers
  spotifyUri?: string;
  youtubeVideoId?: string;
  externalUrl: string;
}

export type SourceFilter = "all" | "spotify" | "youtube";
