/**
 * Lesson shape — the actual per-language content lives in
 * src/i18n/lessons/<lang>.json and is served through the useLessons() hook
 * in src/i18n/lessons.ts. This module only re-exports the type so existing
 * consumers can keep importing from '../data/lessons'.
 */
export interface Lesson {
  title: string;
  paragraphs: string[];
  question: string;
}
