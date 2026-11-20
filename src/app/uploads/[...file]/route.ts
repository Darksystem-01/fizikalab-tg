import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/x-rar-compressed",
  "7z": "application/x-7z-compressed",
  txt: "text/plain; charset=utf-8",
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ file: string[] }> }
) {
  try {
    const { file } = await context.params;
    if (!file || file.length === 0) {
      return NextResponse.json({ error: "Fayl nomi kiritilmadi" }, { status: 400 });
    }

    const relativePath = file.join("/");

    // Strict path traversal defense
    if (
      relativePath.includes("..") ||
      relativePath.includes("\0") ||
      path.isAbsolute(relativePath) ||
      !/^[a-zA-Z0-9_\u0400-\u04FF\.\-\/]+$/.test(relativePath)
    ) {
      return NextResponse.json({ error: "Ruxsat etilmagan fayl yo'li" }, { status: 403 });
    }

    const candidateDirs = [
      path.join(process.cwd(), "public", "uploads"),
      path.join(os.tmpdir(), "fizikalab_uploads"),
      path.join("/tmp", "uploads"),
    ];

    let foundPath: string | null = null;
    for (const dir of candidateDirs) {
      const full = path.join(/*turbopackIgnore: true*/ dir, relativePath);
      if (fs.existsSync(/*turbopackIgnore: true*/ full)) {
        foundPath = full;
        break;
      }
    }

    if (!foundPath) {
      return NextResponse.json({ error: "Fayl topilmadi" }, { status: 404 });
    }

    const buffer = fs.readFileSync(/*turbopackIgnore: true*/ foundPath);
    const ext = relativePath.split(".").pop()?.toLowerCase() || "";
    const mime = MIME_TYPES[ext] || "application/octet-stream";

    const baseName = path.basename(relativePath);
    const isPreviewable = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt"].includes(ext);

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Length": String(buffer.length),
        "Content-Disposition": isPreviewable
          ? `inline; filename="${baseName}"`
          : `attachment; filename="${baseName}"`,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Faylni o'qishda xatolik yuz berdi" }, { status: 500 });
  }
}
