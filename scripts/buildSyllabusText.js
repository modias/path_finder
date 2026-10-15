/**
 * Build data/syllabusText.json from syllabus documents.
 *
 * One text chunk per catalog course, keyed by the catalog code
 * (`SUBJECT NUMBER`, one space, catalog casing). Direct lookup only —
 * this script does not embed anything.
 *
 * Usage:
 *   node scripts/buildSyllabusText.js <file-or-directory>
 *
 * Re-running overwrites data/syllabusText.json.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { COURSES } from "../src/data/courseCatalog.js";
import { courseKey } from "../src/data/prerequisites.js";
import { SYLLABUS_TEXT_PATH } from "../lib/syllabusLookup.js";

export const SYLLABUS_TEXT_MAX_CHARS = 1500;

const TEXT_EXT = new Set([".txt", ".md", ".text", ".markdown"]);
const TEXTUTIL_EXT = new Set([".docx", ".doc", ".rtf", ".html", ".htm"]);
const PDF_EXT = new Set([".pdf"]);

const HEADING_CODE = /^\s*(?:[-*•]\s*)?([A-Za-z]{2,5})\s*(\d{3,4}[A-Za-z]{0,2})(?!\d)\b/;

function codeTokenPattern() {
  return /([A-Za-z]{2,5})\s*(\d{3,4}[A-Za-z]{0,2})(?!\d)/g;
}

const PDF_SWIFT = `
import Foundation
import PDFKit
let path = ProcessInfo.processInfo.environment["SYLLABUS_PDF_PATH"] ?? ""
guard let doc = PDFDocument(url: URL(fileURLWithPath: path)) else {
  fputs("Could not read PDF\\n", stderr)
  exit(1)
}
var pages: [String] = []
for i in 0..<doc.pageCount {
  pages.append(doc.page(at: i)?.string ?? "")
}
print(pages.joined(separator: "\\n\\n"))
`;

/**
 * @param {Array<{ subject: string, number: string }>} [courses]
 * @returns {string[]}
 */
export function catalogCodesFrom(courses = COURSES) {
  return courses.map((course) => courseKey(course.subject, course.number));
}

/**
 * Map a messy extracted code onto the catalog's exact `SUBJECT NUMBER` form.
 * Returns null when the code is not in the catalog.
 * @param {string} raw
 * @param {Iterable<string>} catalogCodes
 * @returns {string | null}
 */
export function normalizeExtractedCode(raw, catalogCodes) {
  const catalog = catalogCodes instanceof Set ? catalogCodes : new Set(catalogCodes);
  const cleaned = String(raw || "").replace(/[_/]+/g, " ");
  const codeToken = codeTokenPattern();
  let match;
  while ((match = codeToken.exec(cleaned))) {
    const candidate = courseKey(match[1], match[2]);
    if (catalog.has(candidate)) return candidate;
  }
  return null;
}

/**
 * Cap stored syllabus text so a long document can't blow the later Gemini budget.
 * Cuts on a paragraph or sentence boundary when it can, otherwise on whitespace.
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
export function capSyllabusText(text, max = SYLLABUS_TEXT_MAX_CHARS) {
  const normalized = String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (normalized.length <= max) return normalized;

  const window = normalized.slice(0, max);
  /** @type {number[]} */
  const cuts = [];
  const paragraphAt = window.lastIndexOf("\n\n");
  if (paragraphAt > 0) cuts.push(paragraphAt);
  for (const token of [". ", "! ", "? ", ".\n", "!\n", "?\n"]) {
    const at = window.lastIndexOf(token);
    if (at >= 0) cuts.push(at + 1);
  }
  if (/[.!?]$/.test(window)) cuts.push(window.length);

  if (cuts.length) {
    return window.slice(0, Math.max(...cuts)).trimEnd();
  }

  const spaceAt = Math.max(window.lastIndexOf(" "), window.lastIndexOf("\n"));
  if (spaceAt > 0) return window.slice(0, spaceAt).trimEnd();
  return "";
}

/**
 * @param {string} text
 * @param {Set<string>} catalog
 * @returns {string[]}
 */
function catalogCodesInText(text, catalog) {
  /** @type {string[]} */
  const found = [];
  const seen = new Set();
  const codeToken = codeTokenPattern();
  let match;
  while ((match = codeToken.exec(text))) {
    const code = normalizeExtractedCode(`${match[1]} ${match[2]}`, catalog);
    if (!code || seen.has(code)) continue;
    seen.add(code);
    found.push(code);
  }
  return found;
}

/**
 * @param {string} name
 * @param {Set<string>} catalog
 * @returns {string | null}
 */
function codeFromFilename(name, catalog) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  return normalizeExtractedCode(base, catalog);
}

/**
 * @param {string} text
 * @param {Set<string>} catalog
 * @returns {Array<{ code: string, text: string }>}
 */
function splitByHeadings(text, catalog) {
  /** @type {Array<{ code: string, lines: string[] }>} */
  const sections = [];
  /** @type {{ code: string, lines: string[] } | null} */
  let current = null;

  for (const line of String(text || "").split("\n")) {
    const heading = line.match(HEADING_CODE);
    const code = heading
      ? normalizeExtractedCode(`${heading[1]} ${heading[2]}`, catalog)
      : null;
    if (code) {
      if (current) sections.push(current);
      const rest = line.slice(heading[0].length).replace(/^[\s\-–:]+/, "").trim();
      current = { code, lines: rest ? [rest] : [] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) sections.push(current);

  return sections
    .map((section) => ({ code: section.code, text: section.lines.join("\n").trim() }))
    .filter((section) => section.text);
}

/**
 * @param {{ name: string, text: string }} doc
 * @param {Set<string>} catalog
 * @returns {Array<{ code: string, text: string }>}
 */
function chunksFromDoc(doc, catalog) {
  const text = String(doc.text || "").trim();
  if (!text) return [];

  const fromName = codeFromFilename(doc.name || "", catalog);
  if (fromName) return [{ code: fromName, text }];

  const mentioned = catalogCodesInText(text, catalog);
  if (mentioned.length === 1) return [{ code: mentioned[0], text }];
  if (mentioned.length > 1) return splitByHeadings(text, catalog);
  return [];
}

/**
 * @param {Array<{ name: string, text: string }>} docs
 * @param {Iterable<string>} catalogCodes
 * @returns {Array<{ code: string, text: string }>}
 */
export function ingestSources(docs, catalogCodes) {
  const catalog = new Set(catalogCodes);
  /** @type {Map<string, string>} */
  const byCode = new Map();

  for (const doc of docs) {
    for (const chunk of chunksFromDoc(doc, catalog)) {
      const code = normalizeExtractedCode(chunk.code, catalog);
      if (!code) continue;
      const text = capSyllabusText(chunk.text);
      if (!text) continue;
      const prev = byCode.get(code);
      if (!prev || text.length > prev.length) byCode.set(code, text);
    }
  }

  return [...byCode.entries()]
    .map(([code, text]) => ({ code, text }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * @param {string[]} catalogCodes
 * @param {Array<{ code: string }>} entries
 * @returns {string}
 */
export function formatIngestionReport(catalogCodes, entries) {
  const indexed = new Set(entries.map((entry) => entry.code));
  const missing = catalogCodes.filter((code) => !indexed.has(code));
  const hit = catalogCodes.length - missing.length;
  const missingLabel = missing.length
    ? `${missing.length} without a syllabus match: [${missing.join(", ")}]`
    : "0 without a syllabus match";
  return `${hit}/${catalogCodes.length} courses indexed, ${missingLabel}`;
}

/**
 * Overwrite the index. A second run replaces the file; it does not append.
 * @param {Array<{ code: string, text: string }>} entries
 * @param {string} outPath
 */
export function writeSyllabusIndex(entries, outPath) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`);
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function walkFiles(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else files.push(full);
  }
  return files;
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function readSourceFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXT.has(ext)) return fs.readFileSync(filePath, "utf8");
  if (TEXTUTIL_EXT.has(ext)) {
    return execFileSync("textutil", ["-convert", "txt", "-stdout", filePath], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  }
  if (PDF_EXT.has(ext)) {
    return execFileSync("swift", ["-e", PDF_SWIFT], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      env: { ...process.env, SYLLABUS_PDF_PATH: filePath },
    });
  }
  return "";
}

/**
 * @param {string} sourcePath
 * @returns {Array<{ name: string, text: string }>}
 */
export function readSourceDocs(sourcePath) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Syllabus source not found: ${sourcePath}`);
  }
  const stat = fs.statSync(sourcePath);
  const files = stat.isDirectory() ? walkFiles(sourcePath) : [sourcePath];
  /** @type {Array<{ name: string, text: string }>} */
  const docs = [];
  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (!TEXT_EXT.has(ext) && !TEXTUTIL_EXT.has(ext) && !PDF_EXT.has(ext)) continue;
    try {
      const text = readSourceFile(filePath);
      if (text.trim()) docs.push({ name: path.basename(filePath), text });
    } catch (err) {
      console.error(`Skipping ${filePath}: ${err?.message || err}`);
    }
  }
  return docs;
}

/**
 * @param {{ sourcePath: string, outPath?: string, catalogCodes?: string[] }} options
 * @returns {{ entries: Array<{ code: string, text: string }>, report: string }}
 */
export function runIngestion({
  sourcePath,
  outPath = SYLLABUS_TEXT_PATH,
  catalogCodes = catalogCodesFrom(),
}) {
  const entries = ingestSources(readSourceDocs(sourcePath), catalogCodes);
  writeSyllabusIndex(entries, outPath);
  return { entries, report: formatIngestionReport(catalogCodes, entries) };
}

function main() {
  const sourcePath = process.argv[2];
  if (!sourcePath) {
    console.error("Usage: node scripts/buildSyllabusText.js <path-to-syllabus-doc-or-directory>");
    process.exit(1);
  }
  const { report } = runIngestion({ sourcePath: path.resolve(sourcePath) });
  console.log(report);
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main();
