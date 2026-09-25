export interface Page<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalRecord: number;
    totalPage: number;
  };
}
export interface WordSet {
  id: number;
  name: string;
  description?: string | null;
  wordCount: number;
  isPro: boolean;
  creator?: { id: number; fullName: string };
  folder?: { id: number; name: string };
  learningPath?: { id: number; name: string };
  order?: number;
}
export interface Folder {
  id: number;
  name: string;
  creatorId: number;
  isPublic: boolean;
  isHiddenByAdmin: boolean;
  wordSetCount?: number;
}
export type LibraryItem =
  | { type: "folder"; data: Folder }
  | { type: "word-set"; data: WordSet };
export interface LearningPath {
  id: number;
  name: string;
  description?: string;
  thumbnail?: string | null;
  difficulty: number;
}
export interface PathGroup {
  category: { id: number; name: string };
  totalCount: number;
  learningPaths: LearningPath[];
}
export interface Word {
  id: number;
  wordSetId: number;
  term: string;
  meaning: string;
  phonetic?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
  audioUrl?: string | null;
  note?: string | null;
}
