import { Editor } from "slate";
import { isCollapsed } from "../../../common/queries/isCollapsed";
import { getText } from "../../../common/queries/getText";

export const isBetweenSquareBrackets = (editor: Editor) => {
  const { selection } = editor;
  if (selection && isCollapsed(selection)) {
    const afterCursor = Editor.after(editor, selection, {
      distance: 1,
      unit: "character",
    });
    const beforeCursor = Editor.before(editor, selection, {
      distance: 1,
      unit: "character",
    });
    if (!afterCursor || !beforeCursor) {
      return false;
    }
    const afterRange = Editor.range(editor, selection, afterCursor);
    const beforeRange = Editor.range(editor, beforeCursor, selection);
    const afterText = getText(editor, afterRange);
    const beforeText = getText(editor, beforeRange);
    console.log(`${beforeText} ${afterText}`);
    return beforeText === "[" && afterText === "]";
  }
};
