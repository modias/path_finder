import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isRecommendedElective,
  buildTrackedElectives,
  buildElectivesForCodes,
  buildInitialElectiveCodes,
  listOutsideElectiveCodes,
  lookupTrackedElectiveCatalog,
  pickAlternateElective,
  LOW_MATCH_REFRESH_PERCENT,
  MAX_DISPLAYED_ELECTIVES,
} from "./trackedElectives.js";
import { TRACKED_ELECTIVE_CODES } from "../data/curriculum.js";
import { scoreCourseForReflect } from "./reflectScoring.js";
import { GOOD_OPTION_PERCENT } from "./reflectScoring.js";

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

  it("includes match percent and label from reflect scoring", () => {
    const tracked = buildTrackedElectives({ interestRatings: { dataViz: 5 } });
    const viz = tracked.find((course) => course.code === "ITCS 4123");

    assert.ok(viz);
    assert.equal(typeof viz.matchPercent, "number");
    assert.ok(viz.matchPercent >= 50);
    assert.equal(typeof viz.matchLabel, "string");
    assert.match(viz.matchLabel, /match|option/i);
  });
});

describe("pickAlternateElective", () => {
  it("exposes a low-match refresh threshold at the Weak match band (50%)", () => {
    assert.equal(LOW_MATCH_REFRESH_PERCENT, GOOD_OPTION_PERCENT);
    assert.equal(LOW_MATCH_REFRESH_PERCENT, 50);
  });

  it("lists outside electives beyond the tracked set", () => {
    const pool = listOutsideElectiveCodes();
    assert.ok(pool.length > TRACKED_ELECTIVE_CODES.length);
    for (const code of TRACKED_ELECTIVE_CODES) {
      assert.ok(pool.includes(code));
    }
  });

  it("returns a non-excluded alternate from the outside pool", () => {
    const exclude = TRACKED_ELECTIVE_CODES;
    const alt = pickAlternateElective({
      excludeCodes: exclude,
      reflectAnswers: { interestRatings: { dataViz: 5 } },
    });

    assert.ok(alt);
    assert.ok(!exclude.includes(alt.code));
    assert.notEqual(alt.status, "completed");
  });

  it("prefers higher match percent among alternatives", () => {
    const exclude = TRACKED_ELECTIVE_CODES;
    const alt = pickAlternateElective({
      excludeCodes: exclude,
      reflectAnswers: { interestRatings: { dataViz: 5 } },
    });

    assert.ok(alt);
    const others = buildElectivesForCodes(
      listOutsideElectiveCodes().filter((code) => !exclude.includes(code) && code !== alt.code),
      { interestRatings: { dataViz: 5 } }
    ).filter((course) => course.status !== "completed");

    for (const other of others) {
      assert.ok((alt.matchPercent ?? -1) >= (other.matchPercent ?? -1));
    }
  });

  it("returns null when every outside elective is excluded", () => {
    const alt = pickAlternateElective({
      excludeCodes: listOutsideElectiveCodes(),
      reflectAnswers: {},
    });
    assert.equal(alt, null);
  });
});

describe("buildInitialElectiveCodes", () => {
  it("caps the panel at four electives", () => {
    assert.equal(MAX_DISPLAYED_ELECTIVES, 4);
    const codes = buildInitialElectiveCodes({ interestRatings: { dataViz: 5, ai: 5 } });
    assert.ok(codes.length <= MAX_DISPLAYED_ELECTIVES);
    assert.equal(codes.length, MAX_DISPLAYED_ELECTIVES);
  });

  it("fills past completed tracked electives from the outside pool", () => {
    const codes = buildInitialElectiveCodes({ interestRatings: { dataViz: 5 } });
    const trackedRemaining = buildTrackedElectives({ interestRatings: { dataViz: 5 } }).filter(
      (course) => course.status !== "completed"
    );
    assert.ok(trackedRemaining.length < MAX_DISPLAYED_ELECTIVES);
    assert.equal(codes.length, MAX_DISPLAYED_ELECTIVES);
    for (const code of codes) {
      const card = buildElectivesForCodes([code], { interestRatings: { dataViz: 5 } })[0];
      assert.notEqual(card.status, "completed");
    }
  });
});
