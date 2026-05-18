import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const libraryRoot = path.join(root, "UGCLabs", "reference_library");
const videoFormatsRoot = path.join(libraryRoot, "video_formats");
const videoExtensions = new Set([".mp4", ".mov", ".webm", ".m4v"]);

const records = [];
const issues = [];

async function main() {
  const formatDirs = await readdir(videoFormatsRoot, { withFileTypes: true });

  for (const formatDir of formatDirs.filter((entry) => entry.isDirectory())) {
    const formatId = formatDir.name;
    const dirPath = path.join(videoFormatsRoot, formatId);
    const files = await readdir(dirPath, { withFileTypes: true });
    const names = new Set(files.filter((entry) => entry.isFile()).map((entry) => entry.name));

    for (const file of files.filter((entry) => entry.isFile())) {
      const extension = path.extname(file.name).toLowerCase();

      if (!videoExtensions.has(extension)) {
        continue;
      }

      const baseName = file.name.slice(0, -extension.length);
      const promptName = findPromptName(baseName, names);
      const promptExists = Boolean(promptName);
      const record = {
        id: `${formatId}_${String(records.length + 1).padStart(3, "0")}`,
        videoFormat: formatId,
        subtypeLabel: cleanSubtypeLabel(baseName),
        videoPath: slash(path.relative(libraryRoot, path.join(dirPath, file.name))),
        promptPath: promptName
          ? slash(path.relative(libraryRoot, path.join(dirPath, promptName)))
          : null,
        status: promptExists ? "ready" : "missing_prompt"
      };

      records.push(record);

      if (!promptExists) {
        issues.push({
          type: "missing_prompt",
          videoPath: record.videoPath,
          expectedPromptPath: slash(path.relative(libraryRoot, path.join(dirPath, `${baseName}.txt`)))
        });
      }
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: summarize(records),
    issues,
    records
  };

  await writeFile(
    path.join(libraryRoot, "index.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );

  console.log(JSON.stringify(payload.summary, null, 2));
  if (issues.length) {
    console.log("Issues:");
    console.log(JSON.stringify(issues, null, 2));
  }
}

function findPromptName(baseName, names) {
  for (const candidate of promptNameCandidates(baseName)) {
    if (names.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function promptNameCandidates(baseName) {
  const candidates = [`${baseName}.txt`];
  const withoutTrailingNumber = baseName.replace(/\d+$/u, "");

  if (withoutTrailingNumber !== baseName) {
    candidates.push(`${withoutTrailingNumber}.txt`);
  }

  return Array.from(new Set(candidates));
}

function cleanSubtypeLabel(baseName) {
  return baseName
    .replace(/\d+$/u, "")
    .replace(/\s*(프롬프트|prompt)\s*$/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(items) {
  const byFormat = {};

  for (const item of items) {
    byFormat[item.videoFormat] ??= { total: 0, ready: 0, missingPrompt: 0 };
    byFormat[item.videoFormat].total += 1;
    if (item.status === "ready") {
      byFormat[item.videoFormat].ready += 1;
    } else {
      byFormat[item.videoFormat].missingPrompt += 1;
    }
  }

  return {
    totalVideos: items.length,
    readyVideos: items.filter((item) => item.status === "ready").length,
    missingPromptVideos: items.filter((item) => item.status === "missing_prompt").length,
    byFormat
  };
}

function slash(value) {
  return value.split(path.sep).join("/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
