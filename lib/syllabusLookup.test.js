import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getSyllabusText } from "./syllabusLookup.js";

const previousPath = process.env.SYLLABUS_TEXT_PATH;

afterEach(() => {
  if (previousPath === undefined) delete process.env.SYLLABUS_TEXT_PATH;
  else process.env.SYLLABUS_TEXT_PATH = previousPath;
});

describe("getSyllabusText", () => {
  it("returns null for a course code that is not indexed", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syllabus-lookup-"));
    const indexed = path.join(dir, "syllabusText.json");
    fs.writeFileSync(
      indexed,
      JSON.stringify([{ code: "STAT 2223", text: "Inference and regression." }])
    );

    process.env.SYLLABUS_TEXT_PATH = path.join(dir, "missing.json");
    assert.doesNotThrow(() => getSyllabusText("ITCS 3153"));
    assert.equal(getSyllabusText("ITCS 3153"), null);

    process.env.SYLLABUS_TEXT_PATH = indexed;
    assert.doesNotThrow(() => getSyllabusText("ITCS 3153"));
    assert.equal(getSyllabusText("ITCS 3153"), null);
    assert.equal(getSyllabusText("STAT 2223"), "Inference and regression.");
  });
});
