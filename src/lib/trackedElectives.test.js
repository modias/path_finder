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
import { COURSES } from "../data/courseCatalog.js";
import { normalizeCode } from "../data/prerequisites.js";
import { scoreCourseForReflect } from "./reflectScoring.js";
import { GOOD_OPTION_PERCENT } from "./reflectScoring.js";
import { getEligibleCourses } from "./eligibility.js";
import { buildStudentRecord } from "./studentRecord.js";
import { getSyllabusText } from "../../lib/syllabusLookup.js";

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

describe("elective card match score is per-student", () => {
  it("gives two students with different Section A/B ratings different percentages for the same course", () => {
    const vizFan = { interestRatings: { dataViz: 5 }, styleRatings: { handsOnVsTheory: 5 } };
    const vizSkeptic = { interestRatings: { dataViz: 1 }, styleRatings: { handsOnVsTheory: 1 } };

    const [forFan] = buildElectivesForCodes(["ITCS 4123"], vizFan);
    const [forSkeptic] = buildElectivesForCodes(["ITCS 4123"], vizSkeptic);

    assert.notEqual(forFan.matchPercent, forSkeptic.matchPercent);
    assert.ok(forFan.matchPercent > forSkeptic.matchPercent);
    assert.equal(forFan.matchLabel, "Strong match");
    assert.equal(forSkeptic.matchLabel, "Weak match");
  });

  it("derives the label from the percent band", () => {
    const answers = { interestRatings: { dataViz: 4 } };
    const [card] = buildElectivesForCodes(["ITCS 4123"], answers);
    const expected =
      card.matchPercent >= 75 ? "Strong match" : card.matchPercent >= 50 ? "Good option" : "Weak match";
    assert.equal(card.matchLabel, expected);
  });
});

describe("elective card description", () => {
  const covered = "ITCS 4123";
  const uncovered = listOutsideElectiveCodes().find((code) => getSyllabusText(code) == null);

  it("has one covered and one uncovered outside elective in data/syllabusText.json", () => {
    assert.ok(getSyllabusText(covered));
    assert.ok(uncovered, "expected at least one outside elective without syllabus text");
  });

  it("shows the syllabus-grounded reason for a course in syllabusText.json", () => {
    const grounded = "Builds dashboards in D3 and critiques encodings, per the syllabus.";
    const [card] = buildElectivesForCodes([covered], {}, {
      recommendations: [{ code: covered, reason: grounded, syllabusGrounded: true }],
    });

    assert.equal(card.description, grounded);
    assert.equal(card.descriptionSource, "syllabus");
    assert.notEqual(card.description, card.blurb);
  });

  it("falls back to the catalog blurb for a course not in syllabusText.json", () => {
    const [card] = buildElectivesForCodes([uncovered], {}, {
      recommendations: [
        { code: uncovered, reason: "Score-trail reason, not grounded.", syllabusGrounded: false },
      ],
    });

    assert.ok(card.blurb.length > 0);
    assert.equal(card.description, card.blurb);
    assert.equal(card.descriptionSource, "catalog");
  });

  it("falls back to the blurb when the student has no recommendation run yet", () => {
    const [card] = buildElectivesForCodes([covered], {});
    assert.equal(card.description, card.blurb);
    assert.equal(card.descriptionSource, "catalog");
  });

  it("never throws or renders a blank description on malformed recommendations", () => {
    const malformed = [null, {}, { code: covered, syllabusGrounded: true, reason: "   " }];
    const cards = buildElectivesForCodes([covered, uncovered, "FAKE 9999"], {}, {
      recommendations: malformed,
    });
    for (const card of cards) {
      assert.ok(card.description.trim().length > 0, `${card.code} has a blank description`);
    }
  });
});

describe("Recommended for you gate", () => {
  const strongAnswers = {
    interestRatings: { dataViz: 5, ai: 5, hci: 5, webMobile: 5, cybersecurity: 5, games: 5 },
    styleRatings: { mathComfort: 5, handsOnVsTheory: 5 },
  };
  const emptyRecord = { completed: [], inProgress: [] };

  it("does not badge a high-scoring course when a prerequisite is missing", () => {
    const [blocked] = buildElectivesForCodes(["ITIS 4180"], strongAnswers, { record: emptyRecord });
    const eligibleCodes = getEligibleCourses(COURSES, emptyRecord).map((course) =>
      normalizeCode(`${course.subject} ${course.number}`)
    );

    assert.ok(blocked.matchPercent >= 75);
    assert.ok(!eligibleCodes.includes("ITIS 4180"));
    assert.equal(blocked.recommended, false);

    const [allowed] = buildElectivesForCodes(["ITIS 4180"], strongAnswers, {
      record: buildStudentRecord(),
    });
    assert.equal(allowed.matchPercent, blocked.matchPercent);
    assert.equal(allowed.recommended, true);
  });

  it("only badges courses in getEligibleCourses(COURSES, buildStudentRecord())", () => {
    const eligibleCodes = new Set(
      getEligibleCourses(COURSES, buildStudentRecord()).map((course) =>
        normalizeCode(`${course.subject} ${course.number}`)
      )
    );
    const cards = buildElectivesForCodes(listOutsideElectiveCodes(), strongAnswers);

    assert.ok(cards.some((card) => card.recommended));
    for (const card of cards) {
      if (card.recommended) assert.ok(eligibleCodes.has(card.code), `${card.code} badged but ineligible`);
    }
    assert.ok(
      cards.some((card) => !card.recommended && card.matchPercent >= GOOD_OPTION_PERCENT),
      "expected at least one high-scoring course held back by eligibility"
    );
  });
});

describe("buildInitialElectiveCodes", () => {
  it("caps the panel at four electives", () => {
    assert.equal(MAX_DISPLAYED_ELECTIVES, 4);
    const codes = buildInitialElectiveCodes({ interestRatings: { dataViz: 5, ai: 5 } });
    assert.ok(codes.length <= MAX_DISPLAYED_ELECTIVES);
    assert.equal(codes.length, MAX_DISPLAYED_ELECTIVES);
  });

  it("before any Reflect answers, starts from the plan's tracked electives and fills from the outside pool", () => {
    const codes = buildInitialElectiveCodes({});
    const trackedRemaining = buildTrackedElectives({})
      .filter((course) => course.status !== "completed")
      .map((course) => course.code);
    assert.ok(trackedRemaining.length < MAX_DISPLAYED_ELECTIVES);
    assert.equal(codes.length, MAX_DISPLAYED_ELECTIVES);
    assert.deepEqual(codes.slice(0, trackedRemaining.length), trackedRemaining);
    for (const card of buildElectivesForCodes(codes, {})) {
      assert.notEqual(card.status, "completed");
    }
  });

  it("once answered, shows the student's top electives by match percent", () => {
    const answers = { interestRatings: { webMobile: 5, hci: 5, ai: 1, dataViz: 1 } };
    const codes = buildInitialElectiveCodes(answers);
    const shown = buildElectivesForCodes(codes, answers);
    const rest = buildElectivesForCodes(
      listOutsideElectiveCodes().filter((code) => !codes.includes(code)),
      answers
    ).filter((course) => course.status !== "completed");

    const lowestShown = Math.min(...shown.map((course) => course.matchPercent));
    for (const other of rest) {
      assert.ok(other.matchPercent <= lowestShown, `${other.code} outranks a shown elective`);
    }
    assert.ok(!codes.includes("ITCS 4123"), "a 1/5 data-viz rating should push ITCS 4123 off the panel");
  });

  it("gives two students with different answers different electives", () => {
    const aiFan = buildInitialElectiveCodes({ interestRatings: { ai: 5, webMobile: 1, hci: 1, dataViz: 1 } });
    const webFan = buildInitialElectiveCodes({ interestRatings: { webMobile: 5, hci: 5, ai: 1, dataViz: 1 } });
    assert.notDeepEqual(aiFan, webFan);
    assert.ok(webFan.includes("ITIS 4180"));
    assert.ok(!aiFan.includes("ITIS 4180"));
  });
});

describe("Recommended for you needs real answers", () => {
  it("never badges a course at the neutral default when the student answered nothing", () => {
    const cards = buildElectivesForCodes(listOutsideElectiveCodes(), {});
    assert.ok(cards.some((card) => card.matchPercent === GOOD_OPTION_PERCENT));
    for (const card of cards) {
      assert.equal(card.recommended, false, `${card.code} badged with no answers`);
      assert.equal(card.personalized, false);
    }
  });

  it("badges an eligible course once the student's answers drive its score", () => {
    const [card] = buildElectivesForCodes(["ITIS 4180"], { interestRatings: { webMobile: 5 } });
    assert.equal(card.personalized, true);
    assert.equal(card.recommended, true);
  });

  it("does not badge an eligible course the student's answers say nothing about", () => {
    const [card] = buildElectivesForCodes(["ITIS 4180"], { interestRatings: { ai: 5 } });
    assert.equal(card.matchPercent, GOOD_OPTION_PERCENT);
    assert.equal(card.personalized, false);
    assert.equal(card.recommended, false);
  });
});
