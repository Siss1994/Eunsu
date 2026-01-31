import { NextResponse } from "next/server";
import { readdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
]);

export async function GET() {
  try {
    const files = await readdir(UPLOAD_DIR);

    const images = files
      .filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext) && !f.startsWith(".");
      })
      .sort((a, b) => {
        // Sort by timestamp prefix (newest first is default, but for gallery oldest first)
        const timeA = parseInt(a.split("_")[0]) || 0;
        const timeB = parseInt(b.split("_")[0]) || 0;
        return timeA - timeB;
      })
      .map((f) => `/api/uploads/${f}`);

    return NextResponse.json({ images });
  } catch {
    // Directory doesn't exist yet
    return NextResponse.json({ images: [] });
  }
}
