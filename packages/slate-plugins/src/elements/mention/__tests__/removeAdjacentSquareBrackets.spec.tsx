/** @jsx jsx */

import { Transforms } from "slate";
import { withReact } from "slate-react";
import { jsx } from "../../../__test-utils__/jsx";
import { removeAdjacentSquareBrackets } from "../transforms/removeAdjacentSquareBrackets";

it("should do nothing if not between square brackets", () => {
  const input = (
    <editor>
      <hp>
        <htext>hello</htext>
      </hp>
    </editor>
  ) as any;

  const output = (
    <editor>
      <hp>
        <htext>hello</htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  };
  Transforms.select(editor, selection);

  removeAdjacentSquareBrackets(editor);

  expect(input.children).toEqual(output.children);
});

it("should remove both brackets if between square brackets", () => {
  const input = (
    <editor>
      <hp>
        <htext>[]</htext>
      </hp>
    </editor>
  ) as any;

  const output = (
    <editor>
      <hp>
        <htext></htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 },
  };
  Transforms.select(editor, selection);

  removeAdjacentSquareBrackets(editor);

  expect(input.children).toEqual(output.children);
});
