import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // allow large file uploads

// Allowed extensions matching HEMIS requirements
const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp",
  "doc", "docx", "pdf", "ppt", "pptx",
  "zip", "rar", "7z", "txt"
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 Megabytes

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: "Autentifikatsiya talab qilinadi" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let fileName = "";
    let fileBuffer: Buffer | null = null;
    let fileMime = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "Fayl yuborilmadi." }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Fayl hajmi ruxsat etilgan 50 MB dan oshib ketdi." },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileMime = file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      // JSON body with base64
      const body = (await req.json()) as {
        fileName?: string;
        fileData?: string;
        mimeType?: string;
      };

      if (!body.fileName || !body.fileData) {
        return NextResponse.json({ error: "Fayl ma'lumotlari kiritilmadi." }, { status: 400 });
      }

      fileName = body.fileName;
      fileMime = body.mimeType || "application/octet-stream";

      // Strip data url prefix if present
      const base64Data = body.fileData.includes("base64,")
        ? body.fileData.split("base64,")[1]
        : body.fileData;

      fileBuffer = Buffer.from(base64Data, "base64");
      if (fileBuffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Fayl hajmi ruxsat etilgan 50 MB dan oshib ketdi." },
          { status: 400 }
        );
      }
    }

    const extMatch = fileName.split(".").pop();
    const ext = (extMatch || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Ruxsat etilmagan fayl formati (.${ext}). Ruxsat etilgan turlar: jpg, png, doc, docx, pdf, ppt, pptx, zip, rar.`,
        },
        { status: 400 }
      );
    }

    const safeHash = crypto.randomBytes(8).toString("hex");
    const safeBaseName = fileName.replace(/[^a-zA-Z0-9_\u0400-\u04FF-]/g, "_").slice(0, 40);
    const storedFileName = `${Date.now()}_${safeHash}_${safeBaseName}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, storedFileName), fileBuffer);
    } catch {
      // Fallback if filesystem write is blocked (e.g. read-only serverless):
      // deliver data URI
      const base64Str = fileBuffer.toString("base64");
      const dataUri = `data:${fileMime || "application/octet-stream"};base64,${base64Str}`;
      return NextResponse.json({
        url: dataUri,
        fileName,
        fileSize: fileBuffer.length,
        mimeType: fileMime,
      });
    }

    return NextResponse.json({
      url: `/uploads/${storedFileName}`,
      fileName,
      fileSize: fileBuffer.length,
      mimeType: fileMime,
    });
  } catch {
    return NextResponse.json(
      { error: "Faylni yuklashda xatolik yuz berdi." },
      { status: 500 }
    );
  }
}
