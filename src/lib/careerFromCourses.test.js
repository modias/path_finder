import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  collectPlannedCourseCodes,
  rankCareersForStudent,
  scoreCareersFromCourses,
} from "./careerFromCourses.js";

describe("scoreCareersFromCourses", () => {
  it("maps AI and viz electives to scientist and analyst careers", () => {
    const scores = scoreCareersFromCourses(["ITCS 3153", "ITCS 4122"]);
    assert.ok(scores.get("Data scientist")?.courses.includes("ITCS 3153"));
    assert.ok(scores.get("Data analyst")?.courses.includes("ITCS 4122"));
  });

  it("ignores blocked studio codes with no interest cluster", () => {
    const scores = scoreCareersFromCourses(["DTSC 2301", "STAT 2223"]);
    assert.equal(scores.size, 0);
  });
});

describe("collectPlannedCourseCodes", () => {
  it("prefers Reflect recommendations when present", () => {
    const codes = collectPlannedCourseCodes({
      recommendations: [{ code: "ITCS 3153" }, { code: "ITIS 3200" }],
      reflectAnswers: { interestRatings: { hci: 5 } },
    });
    assert.deepEqual(codes, ["ITCS 3153", "ITIS 3200"]);
  });
});

describe("rankCareersForStudent", () => {
  it("returns only careers supported by planned courses, strongest first", () => {
    const ranked = rankCareersForStudent({
      courseCodes: ["ITCS 3153", "ITCS 3156", "ITIS 3200"],
    });
    assert.ok(ranked.length >= 2);
    assert.equal(ranked[0].role, "Data scientist");
    assert.ok(ranked[0].supportingCourses.includes("ITCS 3153"));
    assert.ok(ranked.some((career) => career.role === "Data ethics & policy analyst"));
    assert.ok(!ranked.some((career) => career.role === "UX / product analyst"));
  });

  it("falls back to an inferred career when courses do not map", () => {
    const ranked = rankCareersForStudent({
      courseCodes: [],
      reflectAnswers: { interestRatings: { hci: 5 } },
    });
    assert.equal(ranked.length, 1);
    assert.equal(ranked[0].role, "UX / product analyst");
  });
});
