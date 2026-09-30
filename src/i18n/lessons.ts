import { useMemo } from 'react';
import type { Lesson } from '../data/lessons';
import { useT, type Language } from './index';
import de from './lessons/de.json';
import en from './lessons/en.json';
import fr from './lessons/fr.json';
import it from './lessons/it.json';
import es from './lessons/es.json';

interface LessonBundle {
  blocks: { title: string; lessonIds: number[] }[];
  lessons: Record<string, Lesson>;
}

const BUNDLES: Record<Language, LessonBundle> = {
  de: de as LessonBundle,
  en: en as LessonBundle,
  fr: fr as LessonBundle,
  it: it as LessonBundle,
  es: es as LessonBundle,
};

/**
 * The 18 lessons and their five blocks in the current app language, with
 * German as a per-field fallback for any missing translation. Each translation
 * file mirrors the same shape (blocks + a lessons map keyed by 1..18 as
 * strings), so a partial locale file — say, a lesson we haven't reviewed yet
 * in one language — still renders correctly for the rest.
 *
 * useMemo keyed on `language` so re-renders on unrelated state changes don't
 * re-shape the bundle. Consumers can rely on stable object identity within
 * one active language.
 */
export function useLessons(): LessonBundle {
  const { language } = useT();
  return useMemo(() => {
    const primary = BUNDLES[language];
    if (language === 'de') return primary;
    // Merge per-field: primary wins where present, DE fills the gaps. Blocks
    // are position-critical (same lesson IDs across languages), so an all-or-
    // nothing fallback there is fine; lessons need per-key merging so a single
    // missing lesson.title doesn't drop the entire lesson.
    const merged: LessonBundle = {
      blocks: primary.blocks.length ? primary.blocks : BUNDLES.de.blocks,
      lessons: { ...BUNDLES.de.lessons },
    };
    for (const id of Object.keys(primary.lessons)) {
      const own = primary.lessons[id];
      const base = merged.lessons[id];
      merged.lessons[id] = {
        title: own.title ?? base?.title ?? '',
        paragraphs: own.paragraphs ?? base?.paragraphs ?? [],
        question: own.question ?? base?.question ?? '',
      };
    }
    return merged;
  }, [language]);
}
