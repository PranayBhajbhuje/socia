import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ffmpegPath from "ffmpeg-static";
import { transcodeVideoToWebm } from "./video-transcode";

test("transcodes uploaded MP4 audio to browser-compatible H.264 and MP3", async (t) => {
  assert.ok(ffmpegPath, "FFmpeg binary must be available");
  const directory = await mkdtemp(path.join(tmpdir(), "socia-video-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const inputPath = path.join(directory, "input.mp4");
  const generated = spawnSync(ffmpegPath, [
    "-hide_banner",
    "-loglevel", "error",
    "-f", "lavfi",
    "-i", "color=c=black:s=64x64:d=1",
    "-f", "lavfi",
    "-i", "sine=frequency=880:duration=1",
    "-c:v", "mpeg4",
    "-c:a", "aac",
    "-shortest",
    inputPath,
  ], { encoding: "utf8", windowsHide: true });
  assert.equal(generated.status, 0, generated.stderr);

  const converted = await transcodeVideoToWebm(await readFile(inputPath));
  const outputPath = path.join(directory, "output.mp4");
  await writeFile(outputPath, converted);
  const inspection = spawnSync(ffmpegPath, [
    "-hide_banner",
    "-i", outputPath,
    "-f", "null",
    "-",
  ], { encoding: "utf8", windowsHide: true });

  assert.equal(inspection.status, 0, inspection.stderr);
  assert.match(inspection.stderr, /Video: h264/i);
  assert.match(inspection.stderr, /Audio: mp3/i);
});
