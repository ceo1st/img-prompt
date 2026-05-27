import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { App } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { TagItem } from "../types";
import { normalizeString } from "@/app/utils/normalizeString";
import { translateText } from "@/app/utils/translateAPI";
import { colorArray } from "@/app/data/constants";
import { useFullTagsData } from "@/app/hooks/useFullTagsData";

const normalizeForTranslation = (text: string) => text.trim().replace(/[,，]\s*$/, "");
const getRandomColor = () => colorArray[Math.floor(Math.random() * colorArray.length)];

interface UsePromptLogicProps {
  selectedTags: TagItem[];
  setSelectedTags: (tags: TagItem[]) => void;
  firstChunk: TagItem[];
}

export function usePromptLogic({ selectedTags, setSelectedTags, firstChunk }: UsePromptLogicProps) {
  const { message } = App.useApp();
  const t = useTranslations("ResultSection");
  const locale = useLocale();

  const { searchIndex, findTagData, ensureLoaded } = useFullTagsData(locale, firstChunk);

  const [draftText, setDraftText] = useState<string | null>(null);
  // isComposing state is consumed only via its setter (handleBlur resets it; onCompositionStart/End drive it)
  const [, setIsComposing] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<TagItem[]>([]);
  const [exactMatchTag, setExactMatchTag] = useState<TagItem | null>(null);
  const [inputText, setInputText] = useState("");
  const lastTranslatedSource = useRef("");

  const committedText = useMemo(
    () =>
      selectedTags
        .map((tag) => tag.displayName)
        .filter(Boolean)
        .join(", "),
    [selectedTags],
  );
  const displayedText = draftText ?? committedText;

  // External selectedTags change clears draft (React 19 adjust-state-on-prop-change)
  const [prevSelectedTags, setPrevSelectedTags] = useState(selectedTags);
  if (prevSelectedTags !== selectedTags) {
    setPrevSelectedTags(selectedTags);
    setDraftText(null);
  }

  // Translation: debounced 1500ms, depends on displayedText + locale
  useEffect(() => {
    const normalizedText = normalizeForTranslation(displayedText);
    if (!normalizedText) {
      setTranslatedText("");
      lastTranslatedSource.current = "";
      return;
    }
    if (normalizedText === lastTranslatedSource.current) return;
    if (locale === "en") {
      setTranslatedText(displayedText);
      return;
    }
    let canceled = false;
    const timer = setTimeout(async () => {
      try {
        setIsTranslating(true);
        const translated = await translateText(displayedText, "auto", locale);
        if (canceled) return;
        setTranslatedText(translated);
        lastTranslatedSource.current = normalizeForTranslation(displayedText);
      } catch (error) {
        if (canceled) return;
        console.warn("自动翻译失败:", error);
        setTranslatedText("");
      } finally {
        if (!canceled) setIsTranslating(false);
      }
    }, 1500);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [displayedText, locale]);

  // Recommendation: debounced 150ms, depends on displayedText + searchIndex
  useEffect(() => {
    const timer = setTimeout(() => {
      const lastTagName = normalizeString(displayedText.split(", ").pop()?.trim() || "");
      if (!lastTagName) {
        setSuggestedTags([]);
        setExactMatchTag(null);
        return;
      }
      if (!searchIndex) {
        // Full data not loaded yet — skip; will retrigger when fullTags arrives
        setSuggestedTags([]);
        setExactMatchTag(null);
        return;
      }

      // Candidates: prefix-bucket if length >= 2; else full scan (rare)
      let candidates: TagItem[];
      if (lastTagName.length >= 2) {
        candidates = searchIndex.get(lastTagName.slice(0, 2)) ?? [];
      } else {
        const all: TagItem[] = [];
        for (const arr of searchIndex.values()) for (const tag of arr) all.push(tag);
        candidates = all;
      }

      const computeMatches = (searchField: keyof TagItem) => {
        let exact: TagItem | null = null;
        const matches = candidates.filter((tag) => {
          const normalizedField = normalizeString((tag[searchField] as string) || "");
          if (normalizedField === lastTagName) {
            exact = tag;
            return false;
          }
          return normalizedField.includes(lastTagName);
        });
        matches.sort((a, b) => {
          const aN = normalizeString((a[searchField] as string) || "");
          const bN = normalizeString((b[searchField] as string) || "");
          const aS = aN.startsWith(lastTagName);
          const bS = bN.startsWith(lastTagName);
          if (aS !== bS) return aS ? -1 : 1;
          return aN.localeCompare(bN);
        });
        return { exact, matches };
      };

      let { exact, matches } = computeMatches("displayName");
      if (matches.length === 0 && !exact) {
        ({ exact, matches } = computeMatches("langName"));
      }
      setExactMatchTag(exact);
      setSuggestedTags(matches.slice(0, 10));
    }, 150);
    return () => clearTimeout(timer);
  }, [displayedText, searchIndex]);

  // Handlers — draft text is the editing buffer

  const handleResultTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newText = e.target.value;
    // Keep the trailing-comma normalization behavior from the original
    if (newText.endsWith(",") || newText.endsWith("，")) {
      newText = newText.slice(0, -1).replace(/,\s*$/g, "") + ", ";
    }
    setDraftText(newText);
  }, []);

  const handleBlur = useCallback(() => {
    const currentText = draftText ?? committedText;
    const replacedText = currentText
      .replace(/，/g, ", ")
      .replace(/\s+,\s*/g, ", ")
      .replace(/\s+/g, " ");
    const displayNames = replacedText.split(", ").filter((name) => name.trim() !== "");
    const uniqueDisplayNames = Array.from(new Set(displayNames.map((d) => normalizeString(d))));
    const parsed = uniqueDisplayNames.map((displayName) => {
      const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
      return { object, displayName: foundDisplayName || displayName, attribute, langName };
    });
    setSelectedTags(parsed);
    setDraftText(null);
    setIsComposing(false);
  }, [draftText, committedText, findTagData, setSelectedTags]);

  const handleSuggestTagClick = useCallback(
    (tag: TagItem) => {
      const baseText = draftText ?? committedText;
      const displayNames = baseText.split(", ").filter((s) => s.trim());
      const parsed = displayNames.map((displayName) => {
        const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
        return { object, displayName: foundDisplayName || displayName, attribute, langName };
      });
      if (parsed.length > 0) {
        parsed[parsed.length - 1] = tag;
      } else {
        parsed.push(tag);
      }
      setSelectedTags(parsed);
      // draftText cleared by the in-render prev-check when selectedTags identity changes
    },
    [draftText, committedText, findTagData, setSelectedTags],
  );

  const handleConstantText = useCallback(
    (constantText: string, successMessageKey: string) => {
      const baseText = draftText ?? committedText;
      const newText = baseText ? baseText + ", " + constantText : constantText;
      const displayNames = newText.split(", ").filter(Boolean);
      const uniqueDisplayNames = Array.from(new Set(displayNames));
      const newSelectedTags = uniqueDisplayNames.map((displayName) => {
        const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
        return { object, displayName: foundDisplayName || displayName, attribute, langName };
      });
      setSelectedTags(newSelectedTags);
      message.success(t(successMessageKey));
    },
    [draftText, committedText, findTagData, setSelectedTags, message, t],
  );

  const handleClear = useCallback(() => {
    setSelectedTags([]);
    message.success(t("clearSuccess"));
  }, [setSelectedTags, message, t]);

  const handleColorReplace = useCallback(() => {
    const currentText = draftText ?? committedText;
    const combinedColorRegex = new RegExp(`\\b(${colorArray.join("|")})\\b`, "gi");
    const matches = currentText.match(combinedColorRegex);
    if (!matches || matches.length === 0) {
      message.info(t("randomColor-noMatch"));
      return;
    }
    // Reparse + commit immediately so the random colors persist across tag clicks
    // (without this, draftText holds the new colors until any external selectedTags
    // change clears the draft — losing the color randomization).
    const updatedText = currentText.replace(combinedColorRegex, () => getRandomColor());
    const replacedText = updatedText.replace(/，/g, ", ").replace(/\s+,\s*/g, ", ").replace(/\s+/g, " ");
    const displayNames = replacedText.split(", ").filter((name) => name.trim() !== "");
    const uniqueDisplayNames = Array.from(new Set(displayNames.map((d) => normalizeString(d))));
    const parsed = uniqueDisplayNames.map((displayName) => {
      const { object, attribute, langName, displayName: foundDisplayName } = findTagData(displayName);
      return { object, displayName: foundDisplayName || displayName, attribute, langName };
    });
    setSelectedTags(parsed);
    message.success(t("randomColor-success", { count: matches.length }));
  }, [draftText, committedText, findTagData, setSelectedTags, message, t]);

  const handleTranslate = useCallback(async () => {
    try {
      setIsTranslating(true);
      const translated = await translateText(inputText, "auto", "en");
      if (translated.trim()) {
        handleConstantText(translated, "translateSuccess");
        setInputText("");
      } else {
        message.error(t("translateEmptyError"));
      }
    } catch {
      message.error(t("translateFailError"));
    } finally {
      setIsTranslating(false);
    }
  }, [inputText, t, handleConstantText, message]);

  return {
    resultText: displayedText,
    translatedText,
    isTranslating,
    suggestedTags,
    exactMatchTag,
    setIsComposing,
    handleResultTextChange,
    handleBlur,
    handleSuggestTagClick,
    handleConstantText,
    handleClear,
    handleColorReplace,
    handleFocus: ensureLoaded,
    t,
    inputText,
    setInputText,
    handleTranslate,
  };
}
