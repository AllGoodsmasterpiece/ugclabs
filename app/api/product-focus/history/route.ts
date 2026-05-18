import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { publicGlobalObjectKey, readPublicObject } from "@/lib/r2";

export const runtime = "nodejs";

type ProjectHistoryEntry = {
  jobId: string;
  title: string;
  createdAt: string;
  formatName: string;
  styleName: string;
  videoCount: number;
  thumbnailUrl?: string;
};

const historyIndexPath = path.join(
  process.env.VERCEL ? path.join("/tmp", "ugclabs", "logs") : path.join(process.cwd(), "logs"),
  "history-index.json"
);

export async function GET() {
  try {
    const remote = await readPublicObject(publicGlobalObjectKey("history-index.json"));
    if (remote) {
      return NextResponse.json({ items: JSON.parse(remote.toString("utf8")) as ProjectHistoryEntry[] });
    }

    const raw = await readFile(historyIndexPath, "utf8");
    const items = JSON.parse(raw) as ProjectHistoryEntry[];
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
