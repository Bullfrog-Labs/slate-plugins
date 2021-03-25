/** @jsx jsx */

import { Transforms, Range } from "slate";
import { withReact } from "slate-react";
import { jsx } from "../../../__test-utils__/jsx";
import { isWordAfterMentionTrigger } from "../utils/isWordAfterMentionTrigger";

it("should match if positioned correctly after the trigger", () => {
  const input = (
    <editor>
      <hp>
        <htext>[[hello]]</htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 7 },
    focus: { path: [0, 0], offset: 7 },
  };
  Transforms.select(editor, selection);

  const match = isWordAfterMentionTrigger(editor, {
    at: Range.start(selection),
    trigger: "[[",
  });

  expect(match.match).toBeDefined();
  expect(match!.match![1]).toBe("hello");
});

it("should not match if not positioned correctly after the trigger", () => {
  const input = (
    <editor>
      <hp>
        <htext>[hello]]</htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 7 },
    focus: { path: [0, 0], offset: 7 },
  };
  Transforms.select(editor, selection);

  const match = isWordAfterMentionTrigger(editor, {
    at: Range.start(selection),
    trigger: "[[",
  });

  expect(match.match).toBeNull();
});

it("should match against last line with newline in text", () => {
  const input = (
    <editor>
      <hp>
        <htext>[[hello\n[[hello]]</htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 16 },
    focus: { path: [0, 0], offset: 16 },
  };
  Transforms.select(editor, selection);

  const match = isWordAfterMentionTrigger(editor, {
    at: Range.start(selection),
    trigger: "[[",
  });

  expect(match.match).toBeDefined();
  expect(match!.match![1]).toBe("hello");
});

it("should not match against previous line with newline in text", () => {
  const input = (
    <editor>
      <hp>
        <htext>[[hello{"\n"}hello]]</htext>
      </hp>
    </editor>
  ) as any;

  const editor = withReact(input);

  const selection = {
    anchor: { path: [0, 0], offset: 14 },
    focus: { path: [0, 0], offset: 14 },
  };
  Transforms.select(editor, selection);

  const match = isWordAfterMentionTrigger(editor, {
    at: Range.start(selection),
    trigger: "[[",
  });

  expect(match.match).toBeNull();
});
