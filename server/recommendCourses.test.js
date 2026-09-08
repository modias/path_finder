import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRecommendPrompt,
  finalizeRecommendationsFromText,
  isBlockedFromRecommendation,
  packRecommendationsToLoad,
  parseCreditLoadHours,
  recommendCourses,
  shortlistEligibleCourses,
} from "./recommendCourses.js";
import { filterToEligibleCodes } from "../src/lib/eligibility.js";

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

    assert.deepEqual(
      result.recommendations.map((r) => r.code),
      ["ITCS 3153"]
    );
    assert.equal(result.recommendations[0].matchPercent, 100);
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

    assert.deepEqual(
      result.recommendations.map((r) => r.code).sort(),
      ["ITCS 3153", "ITIS 3200"].sort()
    );
    assert.ok(!result.recommendations.some((r) => r.code === "FAKE 9999"));
  });

  it("falls back to eligible courses when the model response is not valid JSON", () => {
    const result = finalizeRecommendationsFromText(
      "Sorry, here are some thoughts without JSON…",
      eligible
    );

    assert.ok(Array.isArray(result.recommendations));
    assert.ok(result.recommendations.length >= 1);
    assert.ok(result.recommendations.length <= 5);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
    for (const rec of result.recommendations) {
      assert.ok(eligible.some((c) => `${c.subject} ${c.number}` === rec.code));
      assert.ok(typeof rec.reason === "string" && rec.reason.length > 0);
      assert.equal(isBlockedFromRecommendation(rec.code), false);
    }
  });

  it("returns recommendations: [] with a sensible summary when all model codes are filtered out", () => {
    const fakeGemini = JSON.stringify({
      summary: "",
      courses: [
        { code: "ZZZZ 0000", reason: "Nope." },
        { code: "YYYY 1111", reason: "Also nope." },
      ],
    });

    const result = finalizeRecommendationsFromText(fakeGemini, eligible);

    assert.deepEqual(result.recommendations, []);
    assert.equal(result.eligibleCount, eligible.length);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
    assert.match(result.summary, /eligible/i);
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
    assert.ok(result.recommendations.length >= 1);
    assert.ok(result.recommendations.length <= 5);
    assert.ok(typeof result.summary === "string" && result.summary.length > 0);
    assert.ok(typeof result.eligibleCount === "number" && result.eligibleCount >= 1);
    for (const rec of result.recommendations) {
      assert.ok(typeof rec.code === "string" && rec.code.length > 0);
      assert.ok(typeof rec.reason === "string" && rec.reason.length > 0);
      assert.equal(isBlockedFromRecommendation(rec.code), false);
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
    assert.ok(!list.some((c) => `${c.subject} ${c.number}` === "ITSC 2214"));
    assert.ok(!list.some((c) => c.category === "gen_ed"));
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
});
