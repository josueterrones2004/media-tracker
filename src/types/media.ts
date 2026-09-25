export type MediaType =
  | "game"
  | "movie"
  | "series"
  | "book";

export type MediaStatus =
  | "pending"
  | "playing"
  | "watching"
  | "reading"
  | "completed"
  | "paused"
  | "dropped";

export interface MediaItem {
  id: number;
  title: string;
  type: MediaType;
  status: MediaStatus;

  cover: string;
  backdrop?: string;

  releaseYear?: number;
  description?: string;

  season?: number;
  episode?: number;

  hoursPlayed?: number;
}