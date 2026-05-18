import { NextResponse } from "next/server";
import { contentTypeFromFilename, readRuntimeOutput, sanitizeAssetFilename } from "@/lib/runtime-storage";
import { publicGlobalObjectKey, readPublicObject } from "@/lib/r2";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;
    const filename = sanitizeAssetFilename(params.filename);
    const remoteBytes = await readPublicObject(publicGlobalObjectKey(filename));
    const bytes = remoteBytes ?? await readRuntimeOutput(filename);
    const contentType = contentTypeFromFilename(filename);
    const range = request.headers.get("range");

    if (range) {
      const match = range.match(/bytes=(\d*)-(\d*)/);
      const start = match?.[1] ? Number(match[1]) : 0;
      const requestedEnd = match?.[2] ? Number(match[2]) : bytes.length - 1;
      const end = Math.min(requestedEnd, bytes.length - 1);

      if (Number.isFinite(start) && Number.isFinite(end) && start <= end) {
        const chunk = bytes.subarray(start, end + 1);

        return new NextResponse(new Uint8Array(chunk), {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(chunk.length),
            "Content-Range": `bytes ${start}-${end}/${bytes.length}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "no-store"
          }
        });
      }
    }

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset not found." },
      { status: 404 }
    );
  }
}
