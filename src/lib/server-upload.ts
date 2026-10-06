import fs from "node:fs";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MIME_MAP: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/mp4",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

export async function handleUploadRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const contentType = request.headers.get("content-type") || "";
    let buffer: Buffer | null = null;
    let originalName = "upload";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: "No file provided in upload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      originalName = file.name || "upload";
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as { filename?: string; base64?: string };
      if (!body.base64) {
        return new Response(JSON.stringify({ error: "No base64 data provided" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      originalName = body.filename || "upload.jpg";
      const base64Data = body.base64.replace(/^data:[^;]+;base64,/, "");
      buffer = Buffer.from(base64Data, "base64");
    } else {
      const rawBytes = await request.arrayBuffer();
      buffer = Buffer.from(rawBytes);
      const headerName = request.headers.get("x-filename");
      if (headerName) originalName = headerName;
    }

    if (!buffer || buffer.length === 0) {
      return new Response(JSON.stringify({ error: "Empty file received" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const cleanBase = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const safeFilename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeFilename);

    await fs.promises.writeFile(filePath, buffer);

    const publicUrl = `/uploads/${safeFilename}`;
    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename: safeFilename,
        size: buffer.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Upload handler error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Upload processing failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function handleServeUpload(
  request: Request,
  pathname: string,
): Promise<Response | null> {
  const filename = path.basename(pathname);
  const filePath = path.join(UPLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const stat = await fs.promises.stat(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME_MAP[ext] || "application/octet-stream";

  const range = request.headers.get("range");
  if (range && range.startsWith("bytes=")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;

    if (start >= stat.size || end >= stat.size) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${stat.size}` },
      });
    }

    const chunksize = end - start + 1;
    const fileStream = fs.createReadStream(filePath, { start, end });
    const webStream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        fileStream.destroy();
      },
    });

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunksize),
        "Content-Type": mimeType,
      },
    });
  }

  const fileStream = fs.createReadStream(filePath);
  const webStream = new ReadableStream({
    start(controller) {
      fileStream.on("data", (chunk) => controller.enqueue(chunk));
      fileStream.on("end", () => controller.close());
      fileStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      fileStream.destroy();
    },
  });

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Length": String(stat.size),
      "Content-Type": mimeType,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
