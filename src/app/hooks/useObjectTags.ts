"use client";
import { useEffect, useState } from "react";
import { BASE_PATH } from "@/app/utils/basePath";
import { TagItem } from "@/app/components/types";

// 模块级缓存：按 locale + objectIndex 组合键，避免“切语言一定整路由重挂载”这一隐式假设
// 模块级而非 useRef，原因：（1）渲染期可安全读取，不触发 react-hooks/refs；
// （2）跨 hook 实例共享同一份缓存，符合“同一份静态资源不应重复抓取”的语义
const tagCache = new Map<string, TagItem[]>();
const seededLocales = new Set<string>();

type FetchedState = { key: string; data: TagItem[] } | null;

const cacheKey = (locale: string, objectIndex: number) => `${locale}:${objectIndex}`;

export function useObjectTags(locale: string, objectIndex: number, firstChunk: TagItem[]): TagItem[] {
  // 每个 locale 第一次见到时，把 firstChunk 注入该 locale 的 index 0
  if (!seededLocales.has(locale)) {
    seededLocales.add(locale);
    tagCache.set(cacheKey(locale, 0), firstChunk);
  }

  const key = cacheKey(locale, objectIndex);
  // 同步读取缓存：命中即在本次渲染立刻返回，避免切对象时的一帧空白
  const cached = tagCache.get(key);

  // 仅用于异步抓取结果；带上 key 标签，防止上次 fetch 的数据泄漏到不同的 objectIndex / locale
  const [fetched, setFetched] = useState<FetchedState>(null);

  useEffect(() => {
    // 已缓存——同步路径已经返回；旧的 fetched 即使残留也被下方 key 比对过滤掉，无需 setState 清理
    if (tagCache.has(key)) return;
    let canceled = false;
    fetch(`${BASE_PATH}/data/prompt-chunks/${locale}/${objectIndex}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<TagItem[]>;
      })
      .then((data) => {
        if (canceled) return;
        tagCache.set(key, data);
        setFetched({ key, data });
      })
      .catch((err) => {
        if (canceled) return;
        console.warn(`[useObjectTags] failed locale=${locale} index=${objectIndex}`, err);
      });
    return () => {
      canceled = true;
    };
  }, [key, locale, objectIndex]);

  if (cached) return cached;
  if (fetched && fetched.key === key) return fetched.data;
  return [];
}
