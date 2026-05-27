import React, { FC, forwardRef, useMemo } from "react";
import { presetPalettes, presetDarkPalettes } from "@ant-design/colors";
import { useTheme } from "next-themes";
import { normalizeString } from "@/app/utils/normalizeString";
import { TagItem } from "./types";
import TagTooltipWrapper from "./TagTooltipWrapper";

const palette = ["blue", "cyan", "green", "lime", "gold", "orange", "volcano", "magenta", "purple", "geekblue"] as const;
type ColorName = (typeof palette)[number];

const ellipsisStyle: React.CSSProperties = {
  display: "inline-block",
  maxWidth: 160,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "bottom",
};

type Palettes = typeof presetPalettes;

interface TagButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  tag: TagItem;
  colorName: ColorName;
  isSelected: boolean;
  isDark: boolean;
  palettes: Palettes;
  onClick: () => void;
}

const TagButton = forwardRef<HTMLButtonElement, TagButtonProps>(
  ({ tag, colorName, isSelected, isDark, palettes, onClick, ...rest }, ref) => {
    const c = (shade: number) => palettes[colorName][shade - 1];

    const tagLangName = normalizeString(tag.langName) !== normalizeString(tag.displayName) ? tag.langName : "";

    let mainBg: string;
    let subBg: string;
    let textColor: string;
    let borderColor: string;
    let dividerColor: string;

    if (isDark) {
      if (isSelected) {
        mainBg = c(6); subBg = c(5); textColor = "#fff"; borderColor = c(8); dividerColor = c(4);
      } else {
        mainBg = c(3); subBg = c(3); textColor = c(7); borderColor = c(5); dividerColor = c(4);
      }
    } else {
      if (isSelected) {
        mainBg = c(7); subBg = c(6); textColor = "#fff"; borderColor = c(8); dividerColor = c(5);
      } else {
        mainBg = c(1); subBg = c(1); textColor = c(7); borderColor = c(5); dividerColor = c(3);
      }
    }

    const buttonStyle: React.CSSProperties = {
      display: "inline-flex",
      border: `1px solid ${borderColor}`,
      background: "transparent",
      padding: 0,
      cursor: "pointer",
      borderRadius: 6,
      overflow: "hidden",
      margin: 4,
      fontSize: 13,
      fontWeight: isSelected ? 600 : 500,
    };

    const mainSpanStyle: React.CSSProperties = {
      ...ellipsisStyle,
      backgroundColor: mainBg,
      color: textColor,
      padding: isSelected ? "4px 10px" : "5px 10px",
      borderRight: tagLangName ? `1px solid ${dividerColor}` : "none",
    };

    const subSpanStyle: React.CSSProperties = {
      ...ellipsisStyle,
      backgroundColor: subBg,
      color: textColor,
      padding: isSelected ? "4px 10px" : "5px 10px",
    };

    return (
      <button {...rest} ref={ref} type="button" onClick={onClick} aria-pressed={isSelected} className="tag-multicolor-btn" style={buttonStyle}>
        <span style={mainSpanStyle}>{tag.displayName}</span>
        {tagLangName && <span style={subSpanStyle}>{tagLangName}</span>}
      </button>
    );
  },
);
TagButton.displayName = "TagButton";

interface TagSectionMulticolorProps {
  tags?: TagItem[];
  selectedNameSet: Set<string>;
  onTagClick: (tag: TagItem) => void;
}

const TagSectionMulticolor: FC<TagSectionMulticolorProps> = ({ tags = [], selectedNameSet, onTagClick }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const palettes = useMemo<Palettes>(() => (isDark ? presetDarkPalettes : presetPalettes), [isDark]);

  return (
    <div className="flex flex-wrap mt-2 mb-1">
      {tags.map((tag, index) => {
        const isSelected = selectedNameSet.has(tag.displayName);
        const colorName = palette[Math.floor(index / 10) % palette.length];
        const key = `${tag.object}-${tag.attribute}-${tag.displayName}`;
        const button = (
          <TagButton
            key={key}
            tag={tag}
            colorName={colorName}
            isSelected={isSelected}
            isDark={isDark}
            palettes={palettes}
            onClick={() => onTagClick(tag)}
          />
        );
        const hasTooltip =
          tag.preview ||
          tag.description ||
          (tag.langName && tag.langName !== tag.displayName && tag.langName.length > 20);
        return hasTooltip ? (
          <TagTooltipWrapper key={key} tag={tag}>
            {button}
          </TagTooltipWrapper>
        ) : (
          button
        );
      })}
    </div>
  );
};

export default TagSectionMulticolor;
