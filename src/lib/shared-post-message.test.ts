import assert from "node:assert/strict";
import test from "node:test";
import { encodeSharedPostMessage, getMessagePreview, getSharedPostId } from "./shared-post-message";

test("shared post messages preserve and safely encode post IDs", () => {
  const body = encodeSharedPostMessage("post id/with symbols");
  assert.equal(getSharedPostId(body), "post id/with symbols");
  assert.equal(getMessagePreview(body), "Shared a post");
});

test("regular and malformed messages are not treated as shared posts", () => {
  assert.equal(getSharedPostId("Hello there"), null);
  assert.equal(getSharedPostId("[[socia-post:%E0%A4%A]]"), null);
  assert.equal(getMessagePreview("Hello there"), "Hello there");
});
