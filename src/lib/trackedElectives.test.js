import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRecommendedElective,
  buildTrackedElectives,
  lookupTrackedElectiveCatalog,
} from "./trackedElectives.js";
import { scoreCourseForReflect } from "./reflectScoring.js";

describe("isRecommendedElective", () => {
  it("does not recommend when the score clears the threshold but the course is not eligible", () => {
    const reflectAnswers = { interestRatings: { dataViz: 5 } };
    const score = scoreCourseForReflect("ITCS 4123", reflectAnswers);

    assert.ok(score >= 3);
    assert.equal(isRecommendedElective("ITCS 4123", reflectAnswers, new Set()), false);
  });

  it("does not recommend when eligible but the score is below the threshold", () => {
    assert.equal(
      isRecommendedElective("ITCS 4123", { interestRatings: { dataViz: 2 } }, new Set(["ITCS 4123"])),
      false
    );
  });

  it("recommends when eligible and the score meets the threshold", () => {
    assert.equal(
      isRecommendedElective("ITCS 4123", { interestRatings: { dataViz: 5 } }, new Set(["ITCS 4123"])),
      true
    );
  });
});

describe("buildTrackedElectives", () => {
  it("uses catalog titles instead of stale curriculum.js names", () => {
    const tracked = buildTrackedElectives();
    const viz = tracked.find((course) => course.code === "ITCS 4123");

    assert.ok(viz);
    assert.equal(viz.name, "Visualization and Visual Communication");
    assert.equal(lookupTrackedElectiveCatalog("ITCS 4123")?.name, viz.name);
  });

  it("derives in-progress status from the student record, not hardcoded metadata", () => {
    const tracked = buildTrackedElectives();
    const ml = tracked.find((course) => course.code === "ITCS 3156");

    assert.ok(ml);
    assert.equal(ml.status, "in_progress");
  });
});
