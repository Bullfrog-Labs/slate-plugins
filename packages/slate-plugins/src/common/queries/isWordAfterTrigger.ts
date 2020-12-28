import { Editor, Point } from "slate";
import { escapeRegExp } from "../utils";
import { getText } from "./getText";

/**
 * Is the word at the point after a trigger (punctuation character)
 * https://github.com/ianstormtaylor/slate/blob/master/packages/slate/src/utils/string.ts#L6
 */
export const isWordAfterTrigger = (
  editor: Editor,
  { at, trigger }: { at: Point; trigger: string }
) => {
  // Point at the start of previous word (excluding punctuation)
  const wordBefore = Editor.before(editor, at, { unit: "word" });
  /*
  // Point before wordBefore
  const before =
    wordBefore &&
    Editor.before(editor, wordBefore, { unit: "character", distance: 2 });
  */

  const lineStart = Editor.before(editor, at, { unit: "line" });
  const lineRange = lineStart && Editor.range(editor, lineStart, at);
  const lineText = getText(editor, lineRange);
  const lastOpenMatch = lineText.match(/^.*\[\[(.+)/);
  const matchFromLineStart = lastOpenMatch && lastOpenMatch[0];
  const matchFromMentionStart = lastOpenMatch && lastOpenMatch[1];
  const prefixLen = matchFromLineStart?.length - matchFromMentionStart?.length;
  const beforeRangeStart = Editor.after(editor, lineStart, {
    unit: "character",
    distance: prefixLen,
  });
  const beforeRange2 = Editor.range(editor, beforeRangeStart, at);

  //console.dir(beforeRange2);
  /*
  // Range from before to start
  const beforeRange = before && Editor.range(editor, before, at);

  // Before text
  const beforeText = getText(editor, beforeRange);

  // Starts with char and ends with word characters
  const escapedTrigger = escapeRegExp(trigger);
  const beforeRegex = new RegExp(`^${escapedTrigger}(\\w+)$`);

  // Match regex on before text
  const match = !!beforeText && beforeText.match(/^\[\[(\w+)$/);

  console.dir(beforeText);
  console.dir(match);

  return {
    range: beforeRange,
    match,
  };
  */
  return {
    range: beforeRange2,
    match: lastOpenMatch,
  };
};
