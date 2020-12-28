import { useCallback, useState } from "react";
import { Editor, Range, Transforms } from "slate";
import { isPointAtMentionEnd, isWordAfterTrigger } from "../../common/queries";
import { isCollapsed } from "../../common/queries/isCollapsed";
import { insertMention } from "./transforms";
import { MentionNodeData, UseMentionOptions } from "./types";
import { getNextIndex, getPreviousIndex } from "./utils";

export const useMention = (
  mentionables: MentionNodeData[] = [],
  { maxSuggestions = 10, trigger = "@", ...options }: UseMentionOptions = {}
) => {
  const [targetRange, setTargetRange] = useState<Range | null>(null);
  const [valueIndex, setValueIndex] = useState(0);
  const [search, setSearch] = useState("");

  console.log(`trigger=${trigger}, search=${search}`);

  const values = mentionables
    .filter((c) => c.value.toLowerCase().includes(search.toLowerCase()))
    .slice(0, maxSuggestions);

  const onAddMention = useCallback(
    (editor: Editor, data: MentionNodeData) => {
      if (targetRange !== null) {
        Transforms.select(editor, targetRange);
        insertMention(editor, data, options);
        return setTargetRange(null);
      }
    },
    [options, targetRange]
  );

  const onKeyDownMention = useCallback(
    (e: any, editor: Editor) => {
      console.log(`key: ${e.key}`);

      // Match square brackets.
      if (e.key === "[") {
        const { selection } = editor;
        if (selection && isCollapsed(selection)) {
          e.preventDefault();
          Transforms.insertText(editor, "[]");
          const cursor = Range.start(selection);
          const middlePoint = Editor.after(editor, cursor, {
            unit: "character",
          });

          Transforms.select(editor, middlePoint);
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
          onAddMention(editor, values[valueIndex]);
          return false;
        }
      }
    },
    [
      values,
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

        const { range, match: beforeMatch } = isWordAfterTrigger(editor, {
          at: cursor,
          trigger,
        });

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
