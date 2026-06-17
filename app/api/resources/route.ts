import { NextResponse } from "next/server";
import path from "path";
import {
  ResourcePathError,
  deleteResourceFile,
  listResourcesDir,
  readResourceFile,
  sanitizeFilename,
  writeResourceFile,
  isBinaryPreviewMime,
} from "@/agent/lib/resources";

function errorResponse(err: unknown) {
  if (err instanceof ResourcePathError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get("path") ?? "state";
    const mode = searchParams.get("mode");

    if (mode === "content" || mode === "download") {
      const { content, mime, name } = await readResourceFile(relPath);

      if (mode === "download") {
        return new NextResponse(new Uint8Array(content), {
          headers: {
            "Content-Type": mime,
            "Content-Disposition": `attachment; filename="${encodeURIComponent(name)}"`,
          },
        });
      }

      if (isBinaryPreviewMime(mime)) {
        return NextResponse.json({
          path: relPath,
          name,
          mime,
          encoding: "base64",
          content: content.toString("base64"),
        });
      }

      const text = content.toString("utf-8");
      return NextResponse.json({
        path: relPath,
        name,
        mime,
        encoding: "utf-8",
        content: text,
      });
    }

    const result = await listResourcesDir(relPath);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string | null) ?? "state/resources";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }

    const filename = sanitizeFilename(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const relPath = path.posix.join(folder.replace(/\\/g, "/"), filename);

    const entry = await writeResourceFile(relPath, buffer);
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const relPath = searchParams.get("path");
    if (!relPath) {
      return NextResponse.json({ error: "path required" }, { status: 400 });
    }

    await deleteResourceFile(relPath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
