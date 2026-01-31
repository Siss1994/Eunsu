import { NextResponse } from "next/server";
import { readFile, readdir } from "fs/promises";
import path from "path";

const MUSIC_LOCATIONS = [
  path.join(process.cwd(), "public", "music"),
  path.join(process.cwd(), "public"),
];

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac"]);

export async function GET() {
  try {
    for (const dir of MUSIC_LOCATIONS) {
      try {
        const files = await readdir(dir);
        const musicFile = files.find((f) => {
          const ext = path.extname(f).toLowerCase();
          return AUDIO_EXTENSIONS.has(ext) && (f.includes("bgm") || f.includes("music") || f.includes("wedding"));
        });

        if (musicFile) {
          const filepath = path.join(dir, musicFile);
          const buffer = await readFile(filepath);
          const ext = path.extname(musicFile).toLowerCase();

          const mimeTypes: Record<string, string> = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            ".m4a": "audio/mp4",
            ".aac": "audio/aac",
          };

          return new NextResponse(buffer, {
            headers: {
              "Content-Type": mimeTypes[ext] || "audio/mpeg",
              "Cache-Control": "public, max-age=86400",
            },
          });
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({ error: "No music file found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
