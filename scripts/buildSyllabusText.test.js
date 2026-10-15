import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSyllabusText } from "../lib/syllabusLookup.js";
import {
  SYLLABUS_TEXT_MAX_CHARS,
  formatIngestionReport,
  ingestSources,
  normalizeExtractedCode,
  runIngestion,
  writeSyllabusIndex,
} from "./buildSyllabusText.js";

const previousPath = process.env.SYLLABUS_TEXT_PATH;
const catalog = ["ITCS 3153", "STAT 2223"];

afterEach(() => {
  if (previousPath === undefined) delete process.env.SYLLABUS_TEXT_PATH;
  else process.env.SYLLABUS_TEXT_PATH = previousPath;
});

describe("buildSyllabusText", () => {
  it("normalizes a differently formatted code to the catalog form so lookup succeeds", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syllabus-ingest-"));
    const source = path.join(dir, "source");
    const outPath = path.join(dir, "syllabusText.json");
    fs.mkdirSync(source);
    fs.writeFileSync(
      path.join(source, "packet.txt"),
      "itcs  3153\nUninformed search, heuristics, and knowledge representation.\n"
    );

    assert.equal(normalizeExtractedCode("itcs  3153", catalog), "ITCS 3153");
    assert.equal(normalizeExtractedCode("itcs3153", catalog), "ITCS 3153");

    const { entries, report } = runIngestion({
      sourcePath: source,
      outPath,
      catalogCodes: catalog,
    });

    assert.equal(entries.length, 1);
    assert.equal(entries[0].code, "ITCS 3153");
    assert.equal(
      report,
      "1/2 courses indexed, 1 without a syllabus match: [STAT 2223]"
    );

    process.env.SYLLABUS_TEXT_PATH = outPath;
    assert.equal(getSyllabusText("ITCS 3153"), entries[0].text);
    assert.match(entries[0].text, /Uninformed search/);
  });

  it("stores a long syllabus trimmed on a boundary instead of mid-word", () => {
    const prefix = "itcs  3153\n";
    const sentence = "Students practice applied methods. ";
    let body = prefix;
    while (body.length + sentence.length <= 1490) body += sentence;
    const longWord = "antidisestablishmentarianism";
    const text = `${body}${longWord} is only partly inside a naive 1500-character slice.`;
    assert.ok(text.length > SYLLABUS_TEXT_MAX_CHARS);

    const [entry] = ingestSources([{ name: "packet.txt", text }], catalog);

    assert.equal(entry.code, "ITCS 3153");
    assert.ok(entry.text.length <= SYLLABUS_TEXT_MAX_CHARS);
    assert.ok(entry.text.length > 0);
    assert.equal(entry.text.includes(longWord), false);
    assert.match(entry.text, /methods\.$/);
    assert.equal(text.startsWith(entry.text), true);
  });

  it("overwrites the index on re-run instead of appending", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syllabus-rerun-"));
    const outPath = path.join(dir, "syllabusText.json");
    writeSyllabusIndex(
      [
        { code: "ITCS 3153", text: "First version." },
        { code: "STAT 2223", text: "Second course." },
      ],
      outPath
    );
    writeSyllabusIndex([{ code: "ITCS 3153", text: "Only the latest." }], outPath);

    const rows = JSON.parse(fs.readFileSync(outPath, "utf8"));
    assert.equal(rows.length, 1);
    assert.deepEqual(rows, [{ code: "ITCS 3153", text: "Only the latest." }]);
  });

  it("formats the ingestion report with catalog codes that had no match", () => {
    const report = formatIngestionReport(catalog, [
      { code: "ITCS 3153", text: "Search." },
    ]);
    assert.equal(report, "1/2 courses indexed, 1 without a syllabus match: [STAT 2223]");
  });
});
