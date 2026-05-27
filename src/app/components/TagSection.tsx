import React, { FC } from "react";
import { theme } from "antd";
import { normalizeString } from "@/app/utils/normalizeString";
import { TagItem } from "./types";
import TagTooltipWrapper from "./TagTooltipWrapper";

interface TagSectionProps {
  tags?: TagItem[];
  selectedNameSet: Set<string>;
  onTagClick: (tag: TagItem) => void;
}

const ellipsisStyle: React.CSSProperties = {
  display: "inline-block",
  maxWidth: 160,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  verticalAlign: "bottom",
};

const buttonResetStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  font: "inherit",
  cursor: "pointer",
  display: "inline-block",
};

const TagSection: FC<TagSectionProps> = ({ tags = [], selectedNameSet, onTagClick }) => {
  const { token } = theme.useToken();

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
      {tags.map((tag) => {
        const isSelected = selectedNameSet.has(tag.displayName);
        const tagLangName = normalizeString(tag.langName) !== normalizeString(tag.displayName) ? tag.langName : "";

        const mainBg = isSelected ? token.colorPrimary : token.colorFillTertiary;
        const mainColor = isSelected ? token.colorTextLightSolid : token.colorText;
        const subBg = isSelected ? token.colorPrimaryActive : token.colorFillSecondary;

        const tagElement = (
          <button
            type="button"
            key={`${tag.object}-${tag.attribute}-${tag.displayName}`}
            onClick={() => onTagClick(tag)}
            aria-pressed={isSelected}
            className={`m-1 rounded transition-all duration-150 ease-in-out hover:scale-105 hover:shadow-md ${isSelected ? "opacity-50" : ""}`}
            style={buttonResetStyle}>
            <span
              style={{
                ...ellipsisStyle,
                backgroundColor: mainBg,
                color: mainColor,
                padding: "4px 8px",
                borderRadius: tagLangName ? "4px 0 0 4px" : 4,
              }}>
              {tag.displayName}
            </span>
            {tagLangName && (
              <span
                style={{
                  ...ellipsisStyle,
                  backgroundColor: subBg,
                  color: mainColor,
                  padding: "4px 8px",
                  borderRadius: "0 4px 4px 0",
                }}>
                {tagLangName}
              </span>
            )}
          </button>
        );

        const hasTooltip = tag.preview || tag.description || (tag.langName && tag.langName !== tag.displayName && tag.langName.length > 20);
        return hasTooltip ? (
          <TagTooltipWrapper key={`${tag.object}-${tag.attribute}-${tag.displayName}`} tag={tag}>
            {tagElement}
          </TagTooltipWrapper>
        ) : (
          tagElement
        );
      })}
    </div>
  );
};

export default TagSection;
