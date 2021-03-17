import { useCallback, useState } from "react";
import { Editor, Range, Transforms } from "slate";
import {
  isPointAtMentionEnd,
  isWordAfterMentionTrigger,
} from "../../common/queries";
import { isCollapsed } from "../../common/queries/isCollapsed";
import { insertMention } from "./transforms";
import { MentionNodeData, UseMentionOptions } from "./types";
import { getNextIndex, getPreviousIndex } from "./utils";
import isHotkey from "is-hotkey";

export const useMention = (
  mentionables: MentionNodeData[] = [],
  addMention: (mention: MentionNodeData) => void,
  { maxSuggestions = 10, trigger = "@", ...options }: UseMentionOptions = {}
) => {
  const [targetRange, setTargetRange] = useState<Range | null>(null);
  const [valueIndex, setValueIndex] = useState(0);
  const [search, setSearch] = useState("");

  const values = mentionables
    .filter((c) => c.value.toLowerCase().includes(search.toLowerCase()))
    .slice(0, maxSuggestions);

  const onAddMention = useCallback(
    (editor: Editor, data: MentionNodeData) => {
      if (targetRange !== null) {
        const mentionStart =
          Editor.before(editor, Range.start(targetRange), {
            distance: 2,
          }) || Range.start(targetRange);
        const mentionEnd =
          Editor.after(editor, Range.end(targetRange), {
            distance: 2,
          }) || Range.end(targetRange);
        const mentionRange = Editor.range(editor, mentionStart, mentionEnd);
        Transforms.select(editor, mentionRange);
        insertMention(editor, data, options);
        return setTargetRange(null);
      }
    },
    [options, targetRange]
  );

  const onKeyDownMention = useCallback(
    (e: any, editor: Editor) => {
      // Match square brackets.
      if (
        e.key === "[" &&
        !isHotkey("mod+[", e) &&
        !isHotkey("mod+shift+[", e)
      ) {
        const { selection } = editor;
        if (selection && isCollapsed(selection)) {
          e.preventDefault();
          Transforms.insertText(editor, "[]");
          const cursor = Range.start(selection);
          const middlePoint = Editor.after(editor, cursor, {
            unit: "character",
          });

          if (middlePoint) {
            Transforms.select(editor, middlePoint);
          }
        }

        return setTargetRange(null);
      }

      if (targetRange) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          return setValueIndex(getNextIndex(valueIndex, values.length - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          return setValueIndex(getPreviousIndex(valueIndex, values.length - 1));
        }
        if (e.key === "Escape") {
          e.preventDefault();
          return setTargetRange(null);
        }

        if (["Tab", "Enter"].includes(e.key)) {
          e.preventDefault();
          if (valueIndex < values.length) {
            const mention = values[valueIndex];
            addMention(mention);
            onAddMention(editor, mention);
          } else {
            console.error(
              `skipping mention add since data not consistent; index=${valueIndex}, ` +
                `values.length=${values.length}`
            );
          }
          return false;
        }
      }
    },
    [
      values,
      values.length,
      valueIndex,
      setValueIndex,
      targetRange,
      setTargetRange,
      onAddMention,
    ]
  );

  const onChangeMention = useCallback(
    (editor: Editor) => {
      const { selection } = editor;

      if (selection && isCollapsed(selection)) {
        const cursor = Range.start(selection);

        const { range, match: beforeMatch } = isWordAfterMentionTrigger(
          editor,
          {
            at: cursor,
            trigger,
          }
        );

        if (beforeMatch && isPointAtMentionEnd(editor, { at: cursor })) {
          setTargetRange(range as Range);
          const [, word] = beforeMatch;
          setSearch(word);
          setValueIndex(0);
          return;
        }
      }

      setTargetRange(null);
    },
    [setTargetRange, setSearch, setValueIndex, trigger]
  );

  return {
    search,
    index: valueIndex,
    target: targetRange,
    values,
    onChangeMention,
    onKeyDownMention,
    onAddMention,
  };
};
