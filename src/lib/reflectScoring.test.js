import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scoreCourseForReflect,
  scoreCourseForReflectDetail,
  inferCareerTarget,
  formatReflectAnswersForPrompt,
  describeCourseMatch,
  matchPercentFromScore,
  matchLabelFromScore,
  pickCoursesBySpecializePreference,
  filterByMatchConfidence,
} from "./reflectScoring.js";

describe("scoreCourseForReflect", () => {
  it("uses the highest specialty rating, not an average", () => {
    const highAi = scoreCourseForReflect("ITCS 3153", {
      interestRatings: { ai: 5, dataViz: 2 },
    });
    const lowAi = scoreCourseForReflect("ITCS 3153", {
      interestRatings: { ai: 2, dataViz: 5 },
    });
    assert.equal(highAi, 5);
    assert.ok(highAi > lowAi);
  });

  it("starts uncategorized courses at a neutral base of 3", () => {
    const detail = scoreCourseForReflectDetail("LBST 2101", {});
    assert.equal(detail.baseScore, 3);
    assert.equal(detail.score, 3);
    assert.equal(detail.label, "Good option");
  });

  it("boosts math-heavy electives when math comfort is high", () => {
    const lovesMath = scoreCourseForReflect("ITCS 3156", {
      interestRatings: { ai: 4 },
      styleRatings: { mathComfort: 5 },
    });
    const avoidsMath = scoreCourseForReflect("ITCS 3156", {
      interestRatings: { ai: 4 },
      styleRatings: { mathComfort: 1 },
    });
    assert.ok(lovesMath > avoidsMath);
    assert.ok(lovesMath > 4);
  });

  it("applies hands-on preference to studio vs theory courses", () => {
    const studioForBuilder = scoreCourseForReflect("ITCS 4232", {
      styleRatings: { handsOnVsTheory: 5 },
    });
    const theoryForBuilder = scoreCourseForReflect("ITCS 3153", {
      styleRatings: { handsOnVsTheory: 5 },
    });
    assert.ok(studioForBuilder > theoryForBuilder);
  });

  it("applies team preference to team vs solo courses", () => {
    const teamForCollaborator = scoreCourseForReflect("ITCS 4232", {
      styleRatings: { soloVsTeam: 5 },
    });
    const soloForCollaborator = scoreCourseForReflect("DTSC 3900", {
      styleRatings: { soloVsTeam: 5 },
    });
    assert.ok(teamForCollaborator > soloForCollaborator);
  });

  it("boosts research electives when research vs product leans research", () => {
    const research = scoreCourseForReflect("DTSC 3900", {
      styleRatings: { researchVsProduct: 5 },
    });
    const product = scoreCourseForReflect("DTSC 3900", {
      styleRatings: { researchVsProduct: 1 },
    });
    assert.ok(research > product);
  });

  it("boosts product/studio courses when research vs product leans product", () => {
    const productOriented = scoreCourseForReflect("ITCS 4232", {
      styleRatings: { researchVsProduct: 1 },
    });
    const researchOriented = scoreCourseForReflect("ITCS 4232", {
      styleRatings: { researchVsProduct: 5 },
    });
    assert.ok(productOriented > researchOriented);
  });

  it("adds a capped industry alignment bonus", () => {
    const withIndustry = scoreCourseForReflectDetail("ITIS 3200", {
      interestRatings: { cybersecurity: 4 },
      industries: ["govSecurity", "gaming"],
    });
    const without = scoreCourseForReflectDetail("ITIS 3200", {
      interestRatings: { cybersecurity: 4 },
      industries: [],
    });
    assert.equal(Number((withIndustry.score - without.score).toFixed(2)), 0.3);
    assert.ok(withIndustry.drivers.some((d) => /industry fit/i.test(d)));
  });

  it("clamps the final score between 1 and 5", () => {
    const high = scoreCourseForReflect("ITCS 3156", {
      interestRatings: { ai: 5 },
      styleRatings: { mathComfort: 5, handsOnVsTheory: 1 },
      industries: ["finance"],
    });
    assert.ok(high <= 5);
    assert.ok(high >= 1);
  });
});

describe("matchLabelFromScore", () => {
  it("labels strong, good, and weak bands", () => {
    assert.equal(matchLabelFromScore(4.2), "Strong match");
    assert.equal(matchLabelFromScore(3.1), "Good option");
    assert.equal(matchLabelFromScore(2.4), "Weak match");
  });
});

describe("matchPercentFromScore", () => {
  it("maps a 5/5 specialty score to 100%", () => {
    assert.equal(matchPercentFromScore(5), 100);
  });

  it("maps a 4/5 specialty score to 80%", () => {
    assert.equal(matchPercentFromScore(4), 80);
  });

  it("clamps above 5 to 100%", () => {
    assert.equal(matchPercentFromScore(6.2), 100);
  });
});

describe("pickCoursesBySpecializePreference", () => {
  const ranked = [
    { code: "A", score: 4.5, clusters: ["ai"] },
    { code: "B", score: 4.4, clusters: ["ai"] },
    { code: "C", score: 4.3, clusters: ["games"] },
  ];

  it("takes top scores as-is when specializing or unanswered", () => {
    assert.deepEqual(
      pickCoursesBySpecializePreference(ranked, { styleRatings: { specializeVsBroad: 5 } }, 2).map(
        (item) => item.code
      ),
      ["A", "B"]
    );
    assert.deepEqual(
      pickCoursesBySpecializePreference(ranked, {}, 2).map((item) => item.code),
      ["A", "B"]
    );
  });

  it("prefers a different cluster among near-ties when staying broad", () => {
    const picked = pickCoursesBySpecializePreference(
      ranked,
      { styleRatings: { specializeVsBroad: 1 } },
      2
    );
    assert.equal(picked[0].code, "A");
    assert.equal(picked[1].code, "C");
  });
});

describe("filterByMatchConfidence", () => {
  it("drops weak matches when enough good options exist", () => {
    const filtered = filterByMatchConfidence(
      [
        { code: "A", score: 4.1 },
        { code: "B", score: 3.2 },
        { code: "C", score: 3.0 },
        { code: "D", score: 2.1 },
      ],
      3
    );
    assert.deepEqual(
      filtered.map((item) => item.code),
      ["A", "B", "C"]
    );
  });
});

describe("describeCourseMatch", () => {
  it("lists matching specialties ordered by the student's rating", () => {
    const matches = describeCourseMatch("ITCS 3153", {
      interestRatings: { ai: 5, games: 2 },
    });
    assert.equal(matches[0].key, "ai");
    assert.equal(matches[0].rating, 5);
    assert.match(matches[0].label, /artificial intelligence/i);
  });
});

describe("inferCareerTarget", () => {
  it("maps the top specialty rating to a career", () => {
    assert.equal(
      inferCareerTarget({ interestRatings: { hci: 5, ai: 2 } }),
      "UX / product analyst"
    );
    assert.equal(
      inferCareerTarget({ interestRatings: { cybersecurity: 5 } }),
      "Data ethics & policy analyst"
    );
  });
});

describe("formatReflectAnswersForPrompt", () => {
  it("includes specialty, style, and industry answers in the prompt text", () => {
    const text = formatReflectAnswersForPrompt({
      registerTerm: "Fall 2026",
      creditLoad: "15 (standard)",
      interestRatings: { ai: 4 },
      styleRatings: { mathComfort: 3 },
      industries: ["healthcare"],
      note: "Interested in internships.",
      careerTarget: "Data scientist",
    });

    assert.match(text, /Fall 2026/);
    assert.match(text, /15 \(standard\)/);
    assert.match(text, /artificial intelligence and machine learning/);
    assert.match(text, /4\/5/);
    assert.match(text, /math and statistics/);
    assert.match(text, /Healthcare \/ biotech/);
    assert.match(text, /Interested in internships/);
    assert.match(text, /Data scientist/);
  });
});
