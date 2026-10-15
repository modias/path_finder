import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildRecommendPrompt,
  finalizeRecommendationsFromText,
  isBlockedFromRecommendation,
  markSyllabusGrounded,
  MIN_RECOMMENDATIONS,
  packRecommendationsToLoad,
  parseCreditLoadHours,
  recommendCourses,
  shortlistEligibleCourses,
} from "./recommendCourses.js";
import { filterToEligibleCodes, getEligibleCourses } from "../src/lib/eligibility.js";
import { COURSES } from "../src/data/courseCatalog.js";
import { buildStudentRecord } from "../src/lib/studentRecord.js";
import { scoreCourseForReflect } from "../src/lib/reflectScoring.js";

const eligible = [
  {
    subject: "ITCS",
    number: "3153",
    title: "Introduction to Artificial Intelligence",
    credits: 3,
    category: "outside_elective",
  },
  {
    subject: "ITIS",
    number: "3200",
    title: "Introduction to Information Security and Privacy",
    credits: 3,
    category: "outside_elective",
  },
  {
    subject: "ITCS",
    number: "4122",
    title: "Visual Analytics",
    credits: 3,
    category: "outside_elective",
  },
];

const eligibleWithBlocked = [
  ...eligible,
  {
    subject: "STAT",
    number: "2223",
    title: "Elements of Statistics II",
    credits: 3,
    category: "computing",
  },
  {
    subject: "ITSC",
    number: "2214",
    title: "Data Structures & Algorithms",
    credits: 3,
    category: "computing",
  },
  {
    subject: "DTSC",
    number: "3601",
    title: "Predictive Analytics A",
    credits: 3,
    category: "core",
  },
];

describe("filterToEligibleCodes (recommend path)", () => {
  it("drops course codes that are not in the eligible set", () => {
    const filtered = filterToEligibleCodes(
      ["ITCS 3153", "FAKE 9999", "ITIS 3200"],
      eligible
    );
    assert.deepEqual(filtered, ["ITCS 3153", "ITIS 3200"]);
  });
});

describe("recommendation blocklist", () => {
  it("marks required studio and support courses as blocked", () => {
    assert.equal(isBlockedFromRecommendation("DTSC 2301"), true);
    assert.equal(isBlockedFromRecommendation("ITSC 2214"), true);
    assert.equal(isBlockedFromRecommendation("ITCS 3153"), false);
  });

  it("never shortlists blocked courses", () => {
    const list = shortlistEligibleCourses(eligibleWithBlocked, {
      interestRatings: { ai: 5 },
    });
    for (const course of list) {
      assert.equal(
        isBlockedFromRecommendation(`${course.subject} ${course.number}`),
        false
      );
    }
    assert.ok(list.some((c) => `${c.subject} ${c.number}` === "ITCS 3153"));
  });

  it("drops blocked codes even when the model returns them", () => {
    const fakeGemini = JSON.stringify({
      summary: "A mix of options.",
      courses: [
        { code: "DTSC 2301", reason: "Core studio." },
        { code: "ITCS 3153", reason: "Matches your AI interest." },
        { code: "ITSC 2214", reason: "Computing support." },
      ],
    });

    const result = finalizeRecommendationsFromText(fakeGemini, eligibleWithBlocked, {
      interestRatings: { ai: 5 },
    });

    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.equal(result.recommendations[0].code, "ITCS 3153");
    assert.equal(result.recommendations[0].matchPercent, 100);
    for (const rec of result.recommendations) {
      assert.equal(isBlockedFromRecommendation(rec.code), false);
    }
  });
});

describe("finalizeRecommendationsFromText", () => {
  it("drops invented course codes before returning recommendations", () => {
    const fakeGemini = JSON.stringify({
      summary: "A mix of solid options.",
      courses: [
        { code: "ITCS 3153", reason: "Matches your AI interest." },
        { code: "FAKE 9999", reason: "Totally made up." },
        { code: "ITIS 3200", reason: "Fits cybersecurity interest." },
      ],
    });

    const result = finalizeRecommendationsFromText(fakeGemini, eligible);

    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.ok(result.recommendations.some((r) => r.code === "ITCS 3153"));
    assert.ok(result.recommendations.some((r) => r.code === "ITIS 3200"));
    assert.ok(!result.recommendations.some((r) => r.code === "FAKE 9999"));
  });

  it("falls back to eligible courses when the model response is not valid JSON", () => {
    const result = finalizeRecommendationsFromText(
      "Sorry, here are some thoughts without JSON…",
      eligible
    );

    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.ok(result.recommendations.length <= 5);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
    for (const rec of result.recommendations) {
      assert.ok(eligible.some((c) => `${c.subject} ${c.number}` === rec.code));
      assert.ok(typeof rec.reason === "string" && rec.reason.length > 0);
      assert.equal(isBlockedFromRecommendation(rec.code), false);
    }
  });

  it("pads to at least 3 recommendations when the model returns only one code", () => {
    const fakeGemini = JSON.stringify({
      summary: "One strong pick.",
      courses: [{ code: "ITCS 3153", reason: "Matches your AI interest." }],
    });

    const result = finalizeRecommendationsFromText(fakeGemini, eligible, {
      interestRatings: { ai: 5 },
    });

    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.equal(result.recommendations[0].code, "ITCS 3153");
  });

  it("falls back to ranked eligible courses when all model codes are filtered out", () => {
    const fakeGemini = JSON.stringify({
      summary: "",
      courses: [
        { code: "ZZZZ 0000", reason: "Nope." },
        { code: "YYYY 1111", reason: "Also nope." },
      ],
    });

    const result = finalizeRecommendationsFromText(fakeGemini, eligible);

    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.equal(result.eligibleCount, eligible.length);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
  });
});

describe("buildRecommendPrompt", () => {
  it("includes registerTerm and creditLoad in the prompt string", () => {
    const prompt = buildRecommendPrompt({
      eligible: eligibleWithBlocked,
      answers: {
        registerTerm: "Fall 2026",
        creditLoad: "12-15 credits",
        interestRatings: { ai: 5 },
        styleRatings: { mathComfort: 4 },
      },
    });

    assert.match(prompt, /Fall 2026/);
    assert.match(prompt, /12-15 credits/);
    assert.match(prompt, /Registration term:/);
    assert.match(prompt, /Target credit load:/);
    assert.match(prompt, /artificial intelligence and machine learning/);
    assert.match(prompt, /4\/5/);
    assert.match(prompt, /ELIGIBLE_COURSES/);
    assert.match(prompt, /matchScore/);
    assert.match(prompt, /Do not invent, abbreviate, or guess/);
    assert.match(prompt, /ITCS 3153/);
    assert.doesNotMatch(prompt, /FAKE 9999/);
    assert.doesNotMatch(prompt, /"code": "DTSC 2301"/);
    assert.doesNotMatch(prompt, /"code": "STAT 2223"/);
    assert.doesNotMatch(prompt, /"code": "ITSC 2214"/);
  });
});

describe("recommendCourses", () => {
  it("returns fallback recommendations when generateContent rejects", async () => {
    const genAI = {
      getGenerativeModel() {
        return {
          generateContent() {
            return Promise.reject(new Error("API key invalid / rate limited"));
          },
        };
      },
    };

    const result = await recommendCourses(genAI, {
      answers: { registerTerm: "Fall 2026", creditLoad: "12-15 credits" },
    });

    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.recommendations.length >= MIN_RECOMMENDATIONS);
    assert.ok(result.recommendations.length <= 5);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
    assert.ok(typeof result.eligibleCount === "number" && result.eligibleCount >= 1);
    for (const rec of result.recommendations) {
      assert.ok(typeof rec.code === "string" && rec.code.length > 0);
      assert.ok(typeof rec.reason === "string" && rec.reason.length > 0);
      assert.equal(isBlockedFromRecommendation(rec.code), false);
      assert.equal(rec.syllabusGrounded, false);
    }
  });
});

describe("shortlistEligibleCourses", () => {
  it("ranks a high-rated specialty elective ahead of gen-ed", () => {
    const list = shortlistEligibleCourses(
      [
        {
          subject: "WRDS",
          number: "1104",
          title: "Writing studio",
          credits: 4,
          category: "gen_ed",
        },
        {
          subject: "ITCS",
          number: "3153",
          title: "Introduction to Artificial Intelligence",
          credits: 3,
          category: "outside_elective",
        },
        {
          subject: "ITIS",
          number: "3200",
          title: "Introduction to Information Security and Privacy",
          credits: 3,
          category: "outside_elective",
        },
        {
          subject: "ITCS",
          number: "4122",
          title: "Visual Analytics",
          credits: 3,
          category: "outside_elective",
        },
        {
          subject: "ITSC",
          number: "2214",
          title: "Data Structures & Algorithms",
          credits: 3,
          category: "computing",
        },
      ],
      { interestRatings: { ai: 5 } },
      3
    );

    assert.equal(`${list[0].subject} ${list[0].number}`, "ITCS 3153");
    assert.ok(list.length >= MIN_RECOMMENDATIONS);
    assert.ok(!list.some((c) => `${c.subject} ${c.number}` === "ITSC 2214"));
    assert.ok(!list.some((c) => c.category === "gen_ed"));
  });

  it("backfills to at least 3 electives when style penalties weaken other matches", () => {
    const list = shortlistEligibleCourses(
      [
        {
          subject: "WRDS",
          number: "1104",
          title: "Writing studio",
          credits: 4,
          category: "gen_ed",
        },
        {
          subject: "ENGL",
          number: "2100",
          title: "Writing about literature",
          credits: 3,
          category: "gen_ed",
        },
        {
          subject: "BIOL",
          number: "1110",
          title: "Principles of Biology I",
          credits: 3,
          category: "gen_ed",
        },
        {
          subject: "ITCS",
          number: "4123",
          title: "Visualization and Visual Communication",
          credits: 3,
          category: "outside_elective",
        },
        {
          subject: "ITIS",
          number: "4180",
          title: "Mobile Application Development",
          credits: 3,
          category: "outside_elective",
        },
        {
          subject: "ITIS",
          number: "4350",
          title: "Design Prototyping",
          credits: 3,
          category: "outside_elective",
        },
      ],
      {
        interestRatings: { dataViz: 5 },
        styleRatings: { programmingConfidence: 1 },
        topicsEnjoyed: ["dataPatterns"],
        skillsWant: ["dataViz"],
      },
      5
    );

    assert.ok(list.length >= MIN_RECOMMENDATIONS);
    assert.equal(`${list[0].subject} ${list[0].number}`, "ITCS 4123");
    const electives = list.filter((c) => c.category === "outside_elective");
    assert.ok(electives.length >= MIN_RECOMMENDATIONS);
    assert.ok(!list.slice(0, MIN_RECOMMENDATIONS).some((c) => c.category === "gen_ed"));
  });
});

describe("syllabus explanations are additive", () => {
  const previousPath = process.env.SYLLABUS_TEXT_PATH;

  afterEach(() => {
    if (previousPath === undefined) delete process.env.SYLLABUS_TEXT_PATH;
    else process.env.SYLLABUS_TEXT_PATH = previousPath;
  });

  it("keeps score, rank, and selection identical whether or not syllabusText.json exists", async () => {
    const answers = { interestRatings: { ai: 5 } };
    const marker = "UNIQUE_SYLLABUS_MARKER uninformed search and constraint satisfaction";
    const record = buildStudentRecord();
    const eligible = getEligibleCourses(COURSES, record);
    const rankedCodes = () =>
      shortlistEligibleCourses(eligible, answers).map((course) => `${course.subject} ${course.number}`);
    const signature = (result) =>
      result.recommendations.map((rec) => ({
        code: rec.code,
        matchPercent: rec.matchPercent,
        matchLabel: rec.matchLabel,
        credits: rec.credits,
        category: rec.category,
      }));

    function makeGenAI() {
      const calls = [];
      return {
        calls,
        getGenerativeModel(config) {
          return {
            generateContent(prompt) {
              const userPrompt = String(prompt ?? "");
              const systemInstruction = String(config?.systemInstruction || "");
              calls.push({ userPrompt, systemInstruction });
              if (userPrompt.includes("SYLLABUS_EXPLANATION_STEP")) {
                const json = userPrompt.slice(
                  userPrompt.indexOf("SELECTED_COURSES:\n") + "SELECTED_COURSES:\n".length
                );
                const payload = JSON.parse(json);
                return Promise.resolve({
                  response: {
                    text: () =>
                      JSON.stringify({
                        courses: [
                          { code: "FAKE 0000", reason: "Should not replace the selected list." },
                          ...payload.map((course) => ({
                            code: course.code,
                            reason: `Covers ${course.syllabusText}`,
                          })),
                        ],
                      }),
                  },
                });
              }
              return Promise.resolve({
                response: {
                  text: () =>
                    JSON.stringify({
                      summary: "Ranked options.",
                      courses: [
                        { code: "ITCS 4123", reason: "Title-only guess about visualization." },
                        { code: "FAKE 9999", reason: "Invented." },
                      ],
                    }),
                },
              });
            },
          };
        },
      };
    }

    process.env.SYLLABUS_TEXT_PATH = path.join(os.tmpdir(), "no-such-syllabusText.json");
    const scoreBefore = scoreCourseForReflect("ITCS 4123", answers);
    const rankBefore = rankedCodes();
    const withoutClient = makeGenAI();
    const without = await recommendCourses(withoutClient, { answers });

    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syllabus-select-"));
    const filePath = path.join(dir, "syllabusText.json");
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        without.recommendations.map((rec) => ({
          code: rec.code,
          text: `${marker} for ${rec.code}.`,
        }))
      )
    );
    process.env.SYLLABUS_TEXT_PATH = filePath;

    const scoreAfter = scoreCourseForReflect("ITCS 4123", answers);
    const rankAfter = rankedCodes();
    const withClient = makeGenAI();
    const withSyllabus = await recommendCourses(withClient, { answers });

    assert.equal(scoreBefore, scoreAfter);
    assert.deepEqual(rankBefore, rankAfter);
    assert.deepEqual(signature(withSyllabus), signature(without));
    assert.deepEqual(
      withSyllabus.recommendations.map((rec) => rec.code),
      without.recommendations.map((rec) => rec.code)
    );

    assert.equal(withoutClient.calls.length, 1);
    assert.equal(withoutClient.calls[0].userPrompt.includes("SYLLABUS_EXPLANATION_STEP"), false);
    assert.equal(withoutClient.calls[0].systemInstruction.includes(marker), false);

    assert.equal(withClient.calls.length, 2);
    assert.equal(withClient.calls[0].userPrompt.includes("SYLLABUS_EXPLANATION_STEP"), false);
    assert.equal(withClient.calls[0].systemInstruction.includes(marker), false);
    assert.equal(withClient.calls[0].userPrompt.includes(marker), false);
    assert.equal(withClient.calls[1].userPrompt.includes("SYLLABUS_EXPLANATION_STEP"), true);
    assert.equal(withClient.calls[1].userPrompt.includes(marker), true);
    assert.match(withClient.calls[1].userPrompt, /scoreTrail/);

    for (const rec of withSyllabus.recommendations) {
      assert.match(rec.reason, /UNIQUE_SYLLABUS_MARKER/);
      assert.equal(rec.reason.includes("FAKE 0000"), false);
      assert.equal(rec.syllabusGrounded, true);
    }
    for (const rec of without.recommendations) {
      assert.equal(rec.reason.includes("UNIQUE_SYLLABUS_MARKER"), false);
      assert.equal(rec.syllabusGrounded, false);
    }
  });

  it("marks only courses whose reason was rewritten from an indexed syllabus", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "syllabus-mark-"));
    const filePath = path.join(dir, "syllabusText.json");
    fs.writeFileSync(
      filePath,
      JSON.stringify([
        { code: "ITCS 4123", text: "Visualization syllabus." },
        { code: "ITCS 3153", text: "AI syllabus." },
      ])
    );
    process.env.SYLLABUS_TEXT_PATH = filePath;

    const before = {
      summary: "s",
      recommendations: [
        { code: "ITCS 4123", reason: "score trail A" },
        { code: "ITCS 3153", reason: "score trail B" },
        { code: "ITIS 3200", reason: "score trail C" },
      ],
    };
    const after = {
      ...before,
      recommendations: [
        { code: "ITCS 4123", reason: "Grounded in the visualization syllabus." },
        { code: "ITCS 3153", reason: "score trail B" },
        { code: "ITIS 3200", reason: "Changed but no syllabus is indexed." },
      ],
    };

    const marked = markSyllabusGrounded(before, after);
    assert.deepEqual(
      marked.recommendations.map((rec) => [rec.code, rec.syllabusGrounded]),
      [
        ["ITCS 4123", true],
        ["ITCS 3153", false],
        ["ITIS 3200", false],
      ]
    );
    assert.equal(marked.summary, "s");
  });
});

describe("parseCreditLoadHours and packRecommendationsToLoad", () => {
  it("reads a labeled credit-load chip", () => {
    assert.deepEqual(parseCreditLoadHours("12 (light)"), {
      min: 12,
      max: 12,
      target: 12,
    });
  });

  it("stops adding courses once the credit cap is reached", () => {
    const packed = packRecommendationsToLoad(
      [
        { code: "ITCS 3153", title: "AI", credits: 3, reason: "a" },
        { code: "ITCS 3156", title: "ML", credits: 3, reason: "b" },
        { code: "ITIS 3135", title: "Web", credits: 3, reason: "c" },
        { code: "ITIS 4350", title: "UX", credits: 3, reason: "d" },
      ],
      { creditLoad: "12 (light)" }
    );
    assert.equal(packed.length, 4);
    assert.equal(
      packed.reduce((sum, rec) => sum + rec.credits, 0),
      12
    );
  });

  it("drops a later course that would exceed the cap", () => {
    const packed = packRecommendationsToLoad(
      [
        { code: "A", title: "A", credits: 4, reason: "a" },
        { code: "B", title: "B", credits: 4, reason: "b" },
        { code: "C", title: "C", credits: 4, reason: "c" },
        { code: "D", title: "D", credits: 4, reason: "d" },
      ],
      { creditLoad: "12 (light)" }
    );
    assert.deepEqual(
      packed.map((rec) => rec.code),
      ["A", "B", "C"]
    );
  });

  it("keeps at least 3 recommendations even when credit load is below that total", () => {
    const packed = packRecommendationsToLoad(
      [
        { code: "ITCS 4123", title: "Viz", credits: 3, reason: "a" },
        { code: "ITIS 4180", title: "Mobile", credits: 3, reason: "b" },
        { code: "ITIS 4350", title: "UX", credits: 3, reason: "c" },
        { code: "ITCS 3153", title: "AI", credits: 3, reason: "d" },
      ],
      { creditLoad: "3" }
    );
    assert.equal(packed.length, MIN_RECOMMENDATIONS);
    assert.deepEqual(
      packed.map((rec) => rec.code),
      ["ITCS 4123", "ITIS 4180", "ITIS 4350"]
    );
  });
});
