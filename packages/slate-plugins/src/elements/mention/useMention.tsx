import { useCallback, useState, useEffect, useMemo } from "react";
import { Editor, Point, Range, Transforms } from "slate";
import { escapeRegExp } from "../../common";
import {
  getText,
  isPointAtMentionEnd,
  isWordAfterMentionTrigger,
} from "../../common/queries";
import { isCollapsed } from "../../common/queries/isCollapsed";
import { insertMention, wrapMentionBrackets } from "./transforms";
import { MentionNodeData, UseMentionOptions } from "./types";
import { getNextIndex, getPreviousIndex } from "./utils";
import isHotkey from "is-hotkey";

export const matchesTriggerAndPattern = (
  editor: Editor,
  { at, trigger, pattern }: { at: Point; trigger: string; pattern: string }
) => {
  // Point at the start of line
  const lineStart = Editor.before(editor, at, { unit: "line" });

  // Range from before to start
  const beforeRange = lineStart && Editor.range(editor, lineStart, at);

  // Before text
  const beforeText = getText(editor, beforeRange);

  // Starts with char and ends with word characters
  const escapedTrigger = escapeRegExp(trigger);

  const beforeRegex = new RegExp(`(?:^|\\s)${escapedTrigger}(${pattern})$`);

  // Match regex on before text
  const match = !!beforeText && beforeText.match(beforeRegex);

  // Point at the start of mention
  const mentionStart = match
    ? Editor.before(editor, at, {
        unit: "character",
        distance: match[1].length + trigger.length,
      })
    : null;

  // Range from mention to start
  const mentionRange = mentionStart && Editor.range(editor, mentionStart, at);

  return {
    range: mentionRange,
    match,
  };
};

const getInitialIndex = (initialIndex: number, values: MentionNodeData[]) => {
  return Math.min(initialIndex, Math.max(values.length - 1, 0));
};

export const useMention = (
  mentionables: MentionNodeData[] = [],
  addMention: (mention: MentionNodeData) => void,
  {
    maxSuggestions = 10,
    trigger = "@",
    mentionableFilter = (search: string) => (c: MentionNodeData) =>
      c.value.toLowerCase().includes(search.toLowerCase()),
    mentionableSearchPattern,
    insertSpaceAfterMention,
    ...options
  }: UseMentionOptions = {},
  initialIndex: number = 0
) => {
  const [targetRange, setTargetRange] = useState<Range | null>(null);

  const [search, setSearch] = useState("");

  // Need to make sure this doesnt change if the args dont, to make the useEffect
  // work below.
  const values = useMemo(
    () =>
      mentionables.filter(mentionableFilter(search)).slice(0, maxSuggestions),
    [mentionables, search, maxSuggestions]
  );

  const [valueIndex, setValueIndex] = useState(
    getInitialIndex(initialIndex, values)
  );

  useEffect(() => {
    setValueIndex(getInitialIndex(initialIndex, values));
  }, [values, initialIndex]);

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
        insertMention(editor, data, options, insertSpaceAfterMention);
        return setTargetRange(null);
      }
    },
    [options, targetRange, insertSpaceAfterMention]
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

        if (selection && !isCollapsed(selection)) {
          e.preventDefault();
          wrapMentionBrackets(editor, selection);
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

      if (selection) {
        const cursor = Range.isBackward(selection)
          ? selection.anchor
          : selection.focus;

        const { range, match: beforeMatch } = mentionableSearchPattern
          ? // new behavior, searches for matching string against pattern right after the trigger
            matchesTriggerAndPattern(editor, {
              at: cursor,
              trigger,
              pattern: mentionableSearchPattern,
            })
          : // previous behavior. searches for a word after typing the first letter. Kept for backward compatibility.
            isWordAfterMentionTrigger(editor, {
              at: cursor,
              trigger,
            });

        if (beforeMatch && isPointAtMentionEnd(editor, { at: cursor })) {
          setTargetRange(range as Range);
          const word = beforeMatch[1];
          setSearch(word);
          return;
        }

        setTargetRange(null);
      }
    },
    [
      setTargetRange,
      setSearch,
      setValueIndex,
      trigger,
      mentionableSearchPattern,
    ]
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
