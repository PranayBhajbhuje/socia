import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from "./VideoMedia";

describe("YouTube video links", () => {
  it("normalizes supported links to the privacy-enhanced embed and watch URLs", () => {
    const source = "https://youtu.be/dXl2NdlmeIE?feature=shared";

    assert.equal(
      getYouTubeEmbedUrl(source),
      "https://www.youtube-nocookie.com/embed/dXl2NdlmeIE?playsinline=1&rel=0",
    );
    assert.equal(
      getYouTubeWatchUrl(source),
      "https://www.youtube.com/watch?v=dXl2NdlmeIE",
    );
  });

  it("does not produce a YouTube fallback for invalid or unrelated URLs", () => {
    assert.equal(getYouTubeWatchUrl("https://example.com/watch?v=dXl2NdlmeIE"), null);
    assert.equal(getYouTubeWatchUrl("https://www.youtube.com/watch?v=short"), null);
  });
});
