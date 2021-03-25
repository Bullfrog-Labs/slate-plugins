import { Editor, Point } from "slate";
import { getText } from "../../../common/queries/getText";

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
  const lines = lineText.split("\n");
  const lastLine = lines[lines.length - 1];
  const lastOpenMatch = lastLine.match(/^.*\[\[(.+)/);
  const matchFromMentionStart = lastOpenMatch && lastOpenMatch[1];

  // Find point by starting from beginning of match, not beginning of line, as
  // that method is unreliable.
  const beforeRangeStart =
    lineStart &&
    matchFromMentionStart &&
    Editor.before(editor, at, {
      distance: matchFromMentionStart.length,
      unit: "character",
    });

  const beforeRange =
    beforeRangeStart && Editor.range(editor, beforeRangeStart, at);

  return {
    range: beforeRange,
    match: lastOpenMatch,
  };
};
