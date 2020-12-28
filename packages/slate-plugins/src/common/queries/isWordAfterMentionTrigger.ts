import { Editor, Point } from "slate";
import { getText } from "./getText";

/**
 * Is the word at the point after a trigger (punctuation character)
 * https://github.com/ianstormtaylor/slate/blob/master/packages/slate/src/utils/string.ts#L6
 */
export const isWordAfterMentionTrigger = (
  editor: Editor,
  { at, trigger }: { at: Point; trigger: string }
) => {
  const lineStart = Editor.before(editor, at, { unit: "line" });
  const lineRange = lineStart && Editor.range(editor, lineStart, at);
  const lineText = getText(editor, lineRange);
  const lastOpenMatch = lineText.match(/^.*\[\[(.+)/);
  const matchFromLineStart = lastOpenMatch && lastOpenMatch[0];
  const matchFromMentionStart = lastOpenMatch && lastOpenMatch[1];
  const prefixLen =
    matchFromLineStart &&
    matchFromMentionStart &&
    matchFromLineStart?.length - matchFromMentionStart?.length;
  const beforeRangeStart =
    lineStart &&
    prefixLen &&
    Editor.after(editor, lineStart, {
      unit: "character",
      distance: prefixLen,
    });
  const beforeRange =
    beforeRangeStart && Editor.range(editor, beforeRangeStart, at);

  return {
    range: beforeRange,
    match: lastOpenMatch,
  };
};
