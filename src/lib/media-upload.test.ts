import assert from "node:assert/strict";
import test from "node:test";
import { getMediaExtension } from "./media-upload";

test("detects supported image and video formats from file signatures", () => {
  const mp4 = Buffer.alloc(12);
  mp4.write("ftyp", 4, "ascii");

  assert.equal(getMediaExtension(Buffer.from([0xff, 0xd8, 0xff]), "image"), "jpg");
  assert.equal(getMediaExtension(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), "video"), "webm");
  assert.equal(getMediaExtension(mp4, "video"), "mp4");
});

test("rejects media signatures that do not match the selected type", () => {
  assert.equal(getMediaExtension(Buffer.from("not media"), "image"), null);
  assert.equal(getMediaExtension(Buffer.from([0xff, 0xd8, 0xff]), "video"), null);
});
