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

  it("maps Intro to Machine Learning to ML engineer, weighted above specialty-area matches", () => {
    const scores = scoreCareersFromCourses(["ITCS 3156"]);
    assert.equal(scores.get("Machine learning engineer")?.score, 2);
    assert.deepEqual(scores.get("Machine learning engineer")?.courses, ["ITCS 3156"]);
    assert.equal(scores.get("Data scientist")?.score, 2);
  });

  it("orders a role's courses strongest match first", () => {
    const scores = scoreCareersFromCourses(["ITCS 4122", "STAT 1222"]);
    assert.deepEqual(scores.get("Data analyst")?.courses, ["STAT 1222", "ITCS 4122"]);
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
    assert.ok(ranked.length >= 3);
    assert.equal(ranked[0].role, "Machine learning engineer");
    assert.deepEqual(ranked[0].supportingCourses, ["ITCS 3156", "ITCS 3153"]);
    assert.ok(ranked.some((career) => career.role === "Data scientist"));
    assert.ok(ranked.some((career) => career.role === "Data ethics & policy analyst"));
    assert.ok(!ranked.some((career) => career.role === "UX / product analyst"));
  });

  it("uses classes already taken and keeps them separate from planned courses", () => {
    const ranked = rankCareersForStudent({
      takenCodes: ["ITCS 3156"],
      courseCodes: ["ITCS 3156", "ITCS 3160"],
      courseTitles: { "ITCS 3156": "Introduction to Machine Learning" },
    });
    const ml = ranked.find((career) => career.role === "Machine learning engineer");
    assert.deepEqual(ml.takenCourses, ["ITCS 3156"]);
    assert.deepEqual(ml.supportingCourses, []);
    assert.match(ml.matchReason, /Introduction to Machine Learning \(ITCS 3156\)/);

    const engineer = ranked.find((career) => career.role === "Data engineer");
    assert.deepEqual(engineer.takenCourses, []);
    assert.deepEqual(engineer.supportingCourses, ["ITCS 3160"]);
  });

  it("breaks score ties in favor of the role backed by classes already taken", () => {
    const ranked = rankCareersForStudent({
      takenCodes: ["ITCS 3153", "ITCS 3156", "STAT 1222", "ITCS 4122"],
      courseCodes: ["ITCS 4123"],
    });
    const analyst = ranked.find((career) => career.role === "Data analyst");
    const ml = ranked.find((career) => career.role === "Machine learning engineer");
    assert.equal(analyst.score, ml.score);
    assert.equal(ranked[0].role, "Machine learning engineer");
  });

  it("ranks careers from taken classes alone when nothing is planned", () => {
    const ranked = rankCareersForStudent({
      takenCodes: ["ITCS 3153", "ITCS 3156"],
      courseCodes: [],
    });
    assert.equal(ranked[0].role, "Machine learning engineer");
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
