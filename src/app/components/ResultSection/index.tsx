import { FC } from "react";
import { Button, Input, Card, Space } from "antd";
import { BgColorsOutlined } from "@ant-design/icons";
import { useLocale } from "next-intl";
import { CONSTANT_BUTTONS, NEGATIVE_TEXT } from "@/app/data/constants";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";
import { TagItem } from "../types";
import { usePromptLogic } from "./usePromptLogic";
import { PromptInput } from "./PromptInput";
import { TagSuggestions } from "./TagSuggestions";
import { TranslationResult } from "./TranslationResult";

interface ResultSectionProps {
  selectedTags: TagItem[];
  setSelectedTags: (tags: TagItem[]) => void;
  firstChunk: TagItem[];
}

const PromptResults: FC<ResultSectionProps> = (props) => {
  const { copyToClipboard } = useCopyToClipboard();
  const locale = useLocale();

  const {
    resultText,
    translatedText,
    isTranslating,
    suggestedTags,
    exactMatchTag,
    setIsComposing,
    handleResultTextChange,
    handleBlur,
    handleFocus,
    handleSuggestTagClick,
    handleConstantText,
    handleClear,
    handleColorReplace,
    t,
    inputText,
    setInputText,
    handleTranslate,
  } = usePromptLogic(props);

  const templateActions = [
    ...CONSTANT_BUTTONS.map(({ text, tooltipKey, promptKey }) => ({
      key: promptKey,
      label: t(promptKey),
      tooltip: t(tooltipKey),
      onClick: () => handleConstantText(text, "insertSuccess"),
    })),
    {
      key: "randomColor",
      icon: <BgColorsOutlined />,
      tooltip: t("tooltip-randomColor"),
      ariaLabel: t("button-randomcolor"),
      onClick: handleColorReplace,
    },
  ];

  const negativeAction = {
    key: "negative",
    label: t("prompt-negative"),
    tooltip: t("tooltip-negative"),
    onClick: () => copyToClipboard(NEGATIVE_TEXT, t("prompt-negative")),
  };

  return (
    <Card variant="outlined" styles={{ body: { padding: 16 } }}>
      <PromptInput
        value={resultText}
        onChange={handleResultTextChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        onCopy={() => copyToClipboard(resultText, t("prompt"))}
        onClear={handleClear}
        templateActions={templateActions}
        negativeAction={negativeAction}
        t={t}
      />

      <TagSuggestions suggestedTags={suggestedTags} exactMatchTag={exactMatchTag} onTagClick={handleSuggestTagClick} />

      <Space.Compact size="small" style={{ display: "flex", marginTop: 12 }}>
        <Input
          value={inputText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputText(e.target.value)}
          onPressEnter={handleTranslate}
          placeholder={t("tooltip-translate")}
          aria-label={t("tooltip-translate")}
          disabled={isTranslating}
        />
        <Button onClick={handleTranslate} loading={isTranslating}>
          {t("button-translate")}
        </Button>
      </Space.Compact>

      <TranslationResult translatedText={translatedText} isTranslating={isTranslating} isVisible={locale !== "en"} t={t} />
    </Card>
  );
};

export default PromptResults;
