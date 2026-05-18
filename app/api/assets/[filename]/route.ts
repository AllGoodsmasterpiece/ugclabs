import { NextResponse } from "next/server";
import { contentTypeFromFilename, readRuntimeOutput, sanitizeAssetFilename } from "@/lib/runtime-storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    const params = await context.params;
    const filename = sanitizeAssetFilename(params.filename);
    const bytes = await readRuntimeOutput(filename);

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeFromFilename(filename),
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
