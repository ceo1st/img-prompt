"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { BASE_PATH } from "@/app/utils/basePath";
import { TagItem } from "@/app/components/types";
import { normalizeString } from "@/app/utils/normalizeString";

const TOTAL_CHUNKS = 16;
const EMPTY_TAG: TagItem = { object: "", attribute: "", langName: "", displayName: "" };

interface UseFullTagsDataResult {
  fullTags: TagItem[] | null;
  searchIndex: Map<string, TagItem[]> | null;
  findTagData: (name: string) => TagItem;
  ensureLoaded: () => void;
}

export function useFullTagsData(locale: string, firstChunk: TagItem[]): UseFullTagsDataResult {
  const [fullTags, setFullTags] = useState<TagItem[] | null>(null);
  const loadingRef = useRef(false);

  const ensureLoaded = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const others = Array.from({ length: TOTAL_CHUNKS - 1 }, (_, i) =>
      fetch(`${BASE_PATH}/data/prompt-chunks/${locale}/${i + 1}.json`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for chunk ${i + 1}`);
        return r.json() as Promise<TagItem[]>;
      }),
    );
    Promise.all(others)
      .then((chunks) => {
        const merged: TagItem[] = [];
        for (const t of firstChunk) merged.push(t);
        for (const chunk of chunks) for (const t of chunk) merged.push(t);
        setFullTags(merged);
      })
      .catch((err) => {
        console.warn("[useFullTagsData] failed", err);
        loadingRef.current = false; // 允许重试
      });
  }, [locale, firstChunk]);

  const searchIndex = useMemo<Map<string, TagItem[]> | null>(() => {
    if (!fullTags) return null;
    const byPrefix = new Map<string, TagItem[]>();
    const push = (key: string, tag: TagItem) => {
      const k = key.slice(0, 2);
      if (!k) return;
      const arr = byPrefix.get(k);
      if (arr) arr.push(tag);
      else byPrefix.set(k, [tag]);
    };
    for (const tag of fullTags) {
      push(normalizeString(tag.displayName), tag);
      const ln = normalizeString(tag.langName);
      if (ln && ln !== normalizeString(tag.displayName)) push(ln, tag);
    }
    return byPrefix;
  }, [fullTags]);

  // findTagData：fullTags 优先；未加载时退化到 firstChunk
  const exactIndex = useMemo(() => {
    const map = new Map<string, TagItem>();
    const source = fullTags ?? firstChunk;
    for (const tag of source) {
      map.set(normalizeString(tag.displayName), tag);
    }
    return map;
  }, [fullTags, firstChunk]);

  const findTagData = useCallback(
    (name: string): TagItem => {
      const normalized = normalizeString(name);
      let found = exactIndex.get(normalized);
      if (!found) found = exactIndex.get(normalized.replace(/ /g, "_"));
      return found ?? EMPTY_TAG;
    },
    [exactIndex],
  );

  return { fullTags, searchIndex, findTagData, ensureLoaded };
}
