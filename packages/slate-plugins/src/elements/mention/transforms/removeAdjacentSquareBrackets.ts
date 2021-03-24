import { Editor, Transforms } from "slate";
import { isCollapsed } from "../../../common/queries/isCollapsed";
import { getText } from "../../../common/queries/getText";

export const removeAdjacentSquareBrackets = (editor: Editor) => {
  const { selection } = editor;
  if (selection && isCollapsed(selection)) {
    const beforeCursor = Editor.before(editor, selection, {
      distance: 1,
      unit: "character",
    });
    const afterCursor = Editor.after(editor, selection, {
      distance: 1,
      unit: "character",
    });
    if (!beforeCursor || !afterCursor) {
      return false;
    }

    const range = Editor.range(editor, beforeCursor, afterCursor);
    const rangeText = getText(editor, range);

    if (rangeText !== "[]") {
      console.debug(`not a [] sandwich; text=${rangeText}`);
      return;
    }

    Transforms.delete(editor, { at: range });
    console.debug(`removed ${rangeText}`);
  }
};
