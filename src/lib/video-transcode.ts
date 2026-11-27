import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

export class VideoTranscodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VideoTranscodeError";
  }
}

function runFfmpeg(inputPath: string, outputPath: string): Promise<void> {
  const binaryPath = ffmpegPath;
  if (binaryPath === null) throw new Error("FFmpeg binary is unavailable for this platform.");

  return new Promise((resolve, reject) => {
    const process = spawn(binaryPath, [
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-i", inputPath,
      "-map", "0:v:0",
      "-map", "0:a:0?",
      "-c:v", "libx264",
      "-preset", "veryfast",
      "-crf", "28",
      "-pix_fmt", "yuv420p",
      "-threads", "2",
      "-c:a", "libmp3lame",
      "-b:a", "128k",
      "-movflags", "+faststart",
      "-f", "mp4",
      outputPath,
    ], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });

    let errorOutput = "";
    process.stderr.setEncoding("utf8");
    process.stderr.on("data", (chunk: string) => {
      errorOutput = `${errorOutput}${chunk}`.slice(-4000);
    });
    process.once("error", reject);
    process.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new VideoTranscodeError(errorOutput.trim() || "FFmpeg could not convert this video."));
    });
  });
}

export async function transcodeVideoToWebm(input: Buffer): Promise<Buffer> {
  const directory = await mkdtemp(path.join(tmpdir(), "socia-video-"));
  const inputPath = path.join(directory, "input");
  const outputPath = path.join(directory, "output.mp4");

  try {
    await writeFile(inputPath, input, { flag: "wx" });
    await runFfmpeg(inputPath, outputPath);
    const output = await readFile(outputPath);
    if (output.length === 0) throw new VideoTranscodeError("FFmpeg produced an empty video.");
    return output;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
