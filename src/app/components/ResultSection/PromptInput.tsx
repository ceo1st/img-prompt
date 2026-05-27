import { FC, ReactNode } from "react";
import { Input, Button, Flex, Tooltip, Typography, Divider } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TemplateAction {
  key: string;
  label?: string;
  icon?: ReactNode;
  tooltip?: string;
  ariaLabel?: string;
  onClick: () => void;
}

interface PromptInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: () => void;
  onFocus?: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onCopy: () => void;
  onClear: () => void;
  templateActions?: TemplateAction[];
  negativeAction?: TemplateAction;
  t: (key: string) => string;
}

export const PromptInput: FC<PromptInputProps> = ({
  value,
  onChange,
  onBlur,
  onFocus,
  onCompositionStart,
  onCompositionEnd,
  onCopy,
  onClear,
  templateActions = [],
  negativeAction,
  t,
}) => {
  return (
    <>
      <Input.TextArea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        autoSize={{ minRows: 6, maxRows: 14 }}
        spellCheck={false}
        aria-label={t("prompt")}
      />

      <Flex justify="space-between" align="center" gap={8} wrap style={{ marginTop: 6, marginBottom: 8 }}>
        <Flex align="center" gap={6} wrap>
          {value.length > 0 && (
            <Text type="secondary" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {value.length} / 380
            </Text>
          )}
          {templateActions.map((action) => {
            const btn = (
              <Button
                key={action.key}
                size="small"
                icon={action.icon}
                onClick={action.onClick}
                aria-label={action.ariaLabel}>
                {action.label}
              </Button>
            );
            return action.tooltip ? (
              <Tooltip key={action.key} title={action.tooltip}>
                {btn}
              </Tooltip>
            ) : (
              btn
            );
          })}
        </Flex>
        <Flex gap={8} wrap align="center">
          <Button size="small" onClick={onClear}>
            {t("button-clear")}
          </Button>
          <Divider orientation="vertical" style={{ height: 18, margin: 0, borderInlineStartColor: "var(--ant-color-border)" }} />
          {negativeAction &&
            (negativeAction.tooltip ? (
              <Tooltip title={negativeAction.tooltip}>
                <Button size="small" icon={<CopyOutlined />} onClick={negativeAction.onClick}>
                  {negativeAction.label}
                </Button>
              </Tooltip>
            ) : (
              <Button size="small" icon={<CopyOutlined />} onClick={negativeAction.onClick}>
                {negativeAction.label}
              </Button>
            ))}
          <Button size="small" type="primary" onClick={onCopy}>
            {t("button-copy")}
          </Button>
        </Flex>
      </Flex>
    </>
  );
};
