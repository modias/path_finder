import { normalizeCode } from "../data/prerequisites.js";
import {
  INTEREST_QUESTIONS,
  STYLE_QUESTIONS,
  INDUSTRY_OPTIONS,
  TOPIC_OPTIONS,
  SKILL_OPTIONS,
  DELIVERABLE_OPTIONS,
  INTEREST_ELECTIVE_CLUSTERS,
  SKILL_COURSE_TAGS,
  DELIVERABLE_COURSE_TAGS,
  MATH_HEAVY_ELECTIVES,
  RESEARCH_ELECTIVES,
  STUDIO_HANDS_ON_ELECTIVES,
  THEORY_ELECTIVES,
  TEAM_ELECTIVES,
  SOLO_ELECTIVES,
  PRODUCT_CAPSTONE_ELECTIVES,
} from "../data/reflectQuestions.js";

export const CAREER_BY_INTEREST = {
  ai: "Data scientist",
  bioinformatics: "Data scientist",
  robotics: "Data scientist",
  dataViz: "Data analyst",
  sportsAnalytics: "Data analyst",
  cybersecurity: "Data ethics & policy analyst",
  webMobile: "Data engineer",
  cloudSystems: "Data engineer",
  games: "Software developer",
  hci: "UX / product analyst",
};

export const STRONG_MATCH_MIN = 4;
export const GOOD_OPTION_MIN = 3;
/** Percent cut points for the Rule 9 display scale (1/5 → 0%, 5/5 → 100%). */
export const STRONG_MATCH_PERCENT = 75;
export const GOOD_OPTION_PERCENT = 50;
export const NEUTRAL_BASE_SCORE = 3;
export const SCORE_NEAR_TIE = 0.3;
export const INDUSTRY_BONUS = 0.3;
export const TOPIC_BONUS = 0.4;
export const SKILL_WANT_BONUS = 0.35;
export const SKILL_HAVE_INTRO_NUDGE = -0.25;
export const DELIVERABLE_BONUS = 0.35;

/**
 * @param {string} code
 * @param {string[] | { prefix?: string, codes?: string[] }} cluster
 * @returns {boolean}
 */
function codeMatchesCluster(code, cluster) {
  const normalized = normalizeCode(code);
  if (Array.isArray(cluster)) {
    return cluster.some((entry) => normalizeCode(entry) === normalized);
  }
  if (cluster.codes?.some((entry) => normalizeCode(entry) === normalized)) return true;
  if (cluster.prefix && normalized.startsWith(`${cluster.prefix} `)) return true;
  return false;
}

/**
 * @param {string} code
 * @param {string[]} list
 * @returns {boolean}
 */
function codeInList(code, list) {
  const normalized = normalizeCode(code);
  return list.some((entry) => normalizeCode(entry) === normalized);
}

/**
 * @param {string} code
 * @returns {string[]}
 */
export function interestKeysForCourse(code) {
  return Object.entries(INTEREST_ELECTIVE_CLUSTERS)
    .filter(([, cluster]) => codeMatchesCluster(code, cluster))
    .map(([key]) => key);
}

/**
 * Short specialty label for prompts (e.g. "artificial intelligence and machine learning").
 * @param {string} key
 * @returns {string}
 */
export function specialtyLabel(key) {
  const question = INTEREST_QUESTIONS.find((item) => item.key === key);
  if (!question) return key;
  const match = question.prompt.match(/in (.+)\?$/i);
  return match ? match[1] : question.prompt;
}

/**
 * Human-readable interest matches for a course, ranked by the student's rating.
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number> }} answers
 * @returns {Array<{ key: string, label: string, rating: number }>}
 */
export function describeCourseMatch(code, answers = {}) {
  const ratings = answers.interestRatings || {};
  return interestKeysForCourse(code)
    .map((key) => {
      const rating = ratings[key];
      if (rating == null) return null;
      return { key, label: specialtyLabel(key), rating };
    })
    .filter(Boolean)
    .sort((a, b) => b.rating - a.rating);
}

/**
 * @param {string} code
 * @returns {boolean}
 */
function isUpperDivisionElective(code) {
  const match = normalizeCode(code).match(/^[A-Z]+ (\d+)/);
  if (!match) return false;
  return Number(match[1]) >= 3000;
}

/**
 * @param {number} score — 1–5 reflect score
 * @returns {"Strong match" | "Good option" | "Weak match"}
 */
export function matchLabelFromScore(score) {
  const percent = matchPercentFromScore(score);
  if (percent >= STRONG_MATCH_PERCENT) return "Strong match";
  if (percent >= GOOD_OPTION_PERCENT) return "Good option";
  return "Weak match";
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Rule 9 — linear rescale of the clamped 1–5 score to a 0–100% match.
 * 1/5 → 0%, 3/5 → 50%, 5/5 → 100%. Round only here, not on intermediate adjustments.
 * @param {number} score
 * @returns {number}
 */
export function matchPercentFromScore(score) {
  if (!Number.isFinite(score)) return 0;
  const clamped = clamp(score, 1, 5);
  return Math.round(((clamped - 1) / 4) * 100);
}

/**
 * Whether a course aligns with any of the student's industry picks.
 * @param {string} code
 * @param {string[]} industryKeys
 * @returns {{ matched: boolean, labels: string[] }}
 */
export function industryMatchForCourse(code, industryKeys = []) {
  if (!industryKeys.length) return { matched: false, labels: [] };
  const keys = interestKeysForCourse(code);
  const normalized = normalizeCode(code);
  const labels = [];

  for (const industryKey of industryKeys) {
    const option = INDUSTRY_OPTIONS.find((item) => item.key === industryKey);
    if (!option) continue;
    const clusterHit = option.clusters?.some((cluster) => keys.includes(cluster));
    const prefixHit = option.prefixes?.some((prefix) =>
      normalized.startsWith(`${prefix} `)
    );
    if (clusterHit || prefixHit) labels.push(option.label);
  }

  return { matched: labels.length > 0, labels };
}

/**
 * Q19 — topics enjoyed that map onto this course's specialty clusters.
 * @param {string} code
 * @param {string[]} topicKeys
 * @returns {{ matched: boolean, labels: string[] }}
 */
export function topicMatchForCourse(code, topicKeys = []) {
  if (!topicKeys.length) return { matched: false, labels: [] };
  const keys = interestKeysForCourse(code);
  if (!keys.length) return { matched: false, labels: [] };
  const labels = [];

  for (const topicKey of topicKeys) {
    const option = TOPIC_OPTIONS.find((item) => item.key === topicKey);
    if (!option) continue;
    if (option.clusters?.some((cluster) => keys.includes(cluster))) {
      labels.push(option.label);
    }
  }

  return { matched: labels.length > 0, labels };
}

/**
 * @param {string} code
 * @param {string} skillKey
 * @returns {{ teaches: boolean, intro: boolean }}
 */
function skillTagForCourse(code, skillKey) {
  const tag = SKILL_COURSE_TAGS[skillKey];
  if (!tag) return { teaches: false, intro: false };
  return {
    teaches: codeInList(code, tag.courses || []),
    intro: codeInList(code, tag.intro || []),
  };
}

/**
 * @param {string} code
 * @param {string[]} deliverableKeys
 * @returns {{ matched: boolean, labels: string[] }}
 */
export function deliverableMatchForCourse(code, deliverableKeys = []) {
  if (!deliverableKeys.length) return { matched: false, labels: [] };
  const labels = [];
  for (const key of deliverableKeys) {
    const courses = DELIVERABLE_COURSE_TAGS[key];
    if (!courses?.length) continue;
    if (codeInList(code, courses)) {
      const label = DELIVERABLE_OPTIONS.find((opt) => opt.key === key)?.label || key;
      labels.push(label);
    }
  }
  return { matched: labels.length > 0, labels };
}

/**
 * Full reflect score breakdown (Rules 1–9 + Q19–Q22).
 * @param {string} code
 * @param {{
 *   interestRatings?: Record<string, number>,
 *   styleRatings?: Record<string, number>,
 *   industries?: string[],
 *   topicsEnjoyed?: string[],
 *   skillsHave?: string[],
 *   skillsWant?: string[],
 *   deliverables?: string[],
 * }} answers
 * @returns {{
 *   score: number,
 *   label: string,
 *   baseScore: number,
 *   drivers: string[],
 *   clusters: string[],
 * }}
 */
export function scoreCourseForReflectDetail(code, answers = {}) {
  const {
    interestRatings = {},
    styleRatings = {},
    industries = [],
    topicsEnjoyed = [],
    skillsHave = [],
    skillsWant = [],
    deliverables = [],
  } = answers;
  const clusters = interestKeysForCourse(code);
  const drivers = [];

  // Rule 1 — base score from highest specialty rating, else neutral 3
  let baseScore = NEUTRAL_BASE_SCORE;
  if (clusters.length) {
    const rated = clusters
      .map((key) => ({ key, rating: interestRatings[key] }))
      .filter((entry) => entry.rating != null);
    if (rated.length) {
      rated.sort((a, b) => b.rating - a.rating);
      baseScore = rated[0].rating;
      drivers.push(`${specialtyLabel(rated[0].key)} interest: ${rated[0].rating}/5`);
    }
  }

  let adjustment = 0;

  // Rule 2 — math comfort
  if (codeInList(code, MATH_HEAVY_ELECTIVES)) {
    const mathComfort = styleRatings.mathComfort;
    if (mathComfort != null) {
      const delta = (mathComfort - 3) * 0.35;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`math comfort: ${mathComfort}/5 → math-heavy elective ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    }
  }

  // Rule 3 — hands-on vs theory
  const handsOnPref = styleRatings.handsOnVsTheory;
  if (handsOnPref != null) {
    if (codeInList(code, STUDIO_HANDS_ON_ELECTIVES)) {
      const delta = (handsOnPref - 3) * 0.25;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`hands-on preference: ${handsOnPref}/5 → studio course ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    } else if (codeInList(code, THEORY_ELECTIVES)) {
      const delta = (3 - handsOnPref) * 0.25;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`hands-on preference: ${handsOnPref}/5 → theory course ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    }
  }

  // Rule 4 — team vs solo
  const teamPref = styleRatings.soloVsTeam;
  if (teamPref != null) {
    if (codeInList(code, TEAM_ELECTIVES)) {
      const delta = (teamPref - 3) * 0.2;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`team preference: ${teamPref}/5 → team course ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    } else if (codeInList(code, SOLO_ELECTIVES)) {
      const delta = (3 - teamPref) * 0.2;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`team preference: ${teamPref}/5 → solo course ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    }
  }

  // Rule 5 — research vs product
  const research = styleRatings.researchVsProduct;
  if (research != null) {
    if (codeInList(code, RESEARCH_ELECTIVES)) {
      const delta = (research - 3) * 0.45;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`research vs product: ${research}/5 → research elective ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    } else if (codeInList(code, PRODUCT_CAPSTONE_ELECTIVES)) {
      const delta = (3 - research) * 0.2;
      adjustment += delta;
      if (delta !== 0) {
        drivers.push(`research vs product: ${research}/5 → product/studio course ${delta > 0 ? "boosted" : "nudged down"}`);
      }
    }
  }

  // Rule 7 — programming-confidence penalty (one-directional)
  const programmingConfidence = styleRatings.programmingConfidence;
  if (
    programmingConfidence != null &&
    programmingConfidence < 3 &&
    isUpperDivisionElective(code)
  ) {
    const delta = -(3 - programmingConfidence) * 0.5;
    adjustment += delta;
    drivers.push(`programming confidence: ${programmingConfidence}/5 → upper-division penalty`);
  }

  // Rule 8 — industry alignment bonus (capped, non-stacking)
  const industry = industryMatchForCourse(code, industries);
  if (industry.matched) {
    adjustment += INDUSTRY_BONUS;
    drivers.push(`industry fit: ${industry.labels.join(", ")} (+${INDUSTRY_BONUS})`);
  }

  // Q19 — topic enjoyment bonus (flat, once per course if any topic maps)
  const topic = topicMatchForCourse(code, topicsEnjoyed);
  if (topic.matched) {
    adjustment += TOPIC_BONUS;
    drivers.push(`topic fit: ${topic.labels.join(", ")} (+${TOPIC_BONUS})`);
  }

  // Q21 — skills wanted: bump courses that teach them (once)
  const wantLabels = [];
  for (const skillKey of skillsWant) {
    const { teaches } = skillTagForCourse(code, skillKey);
    if (teaches) {
      const label = SKILL_OPTIONS.find((opt) => opt.key === skillKey)?.label || skillKey;
      wantLabels.push(label);
    }
  }
  if (wantLabels.length) {
    adjustment += SKILL_WANT_BONUS;
    drivers.push(`skill to build: ${wantLabels.join(", ")} (+${SKILL_WANT_BONUS})`);
  }

  // Q20 — skills already have: small nudge down for intro courses teaching that skill from scratch
  const haveIntroLabels = [];
  for (const skillKey of skillsHave) {
    const { intro } = skillTagForCourse(code, skillKey);
    if (intro) {
      const label = SKILL_OPTIONS.find((opt) => opt.key === skillKey)?.label || skillKey;
      haveIntroLabels.push(label);
    }
  }
  if (haveIntroLabels.length) {
    adjustment += SKILL_HAVE_INTRO_NUDGE;
    drivers.push(
      `already have: ${haveIntroLabels.join(", ")} → intro course nudged (${SKILL_HAVE_INTRO_NUDGE})`
    );
  }

  // Q22 — deliverable match bonus (once)
  const deliverable = deliverableMatchForCourse(code, deliverables);
  if (deliverable.matched) {
    adjustment += DELIVERABLE_BONUS;
    drivers.push(`deliverable fit: ${deliverable.labels.join(", ")} (+${DELIVERABLE_BONUS})`);
  }

  // Rule 9 — clamp to 1–5, then expose the 0–100% display score
  const score = clamp(baseScore + adjustment, 1, 5);
  const matchPercent = matchPercentFromScore(score);
  return {
    score,
    matchPercent,
    label: matchLabelFromScore(score),
    baseScore,
    drivers,
    clusters,
  };
}

/**
 * Weighted elective score from reflect answers (higher = better match).
 * @param {string} code
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number>, industries?: string[] }} answers
 * @returns {number}
 */
export function scoreCourseForReflect(code, answers = {}) {
  return scoreCourseForReflectDetail(code, answers).score;
}

/**
 * Rule 6 — specialize vs broad selection (does not change per-course scores).
 * @template {{ score: number, clusters?: string[] }} T
 * @param {T[]} ranked — already sorted by score descending
 * @param {{ styleRatings?: Record<string, number> }} answers
 * @param {number} limit
 * @returns {T[]}
 */
export function pickCoursesBySpecializePreference(ranked, answers = {}, limit = 5) {
  if (!ranked.length || limit <= 0) return [];
  const specialize = answers.styleRatings?.specializeVsBroad;

  // ≥4 (deep) or unanswered/middle: take top scores as-is
  if (specialize == null || specialize === 3 || specialize >= 4) {
    return ranked.slice(0, limit);
  }

  // ≤2 (broad): among near-ties, prefer a different cluster than already picked
  if (specialize > 2) {
    return ranked.slice(0, limit);
  }

  const picked = [];
  const remaining = [...ranked];

  while (picked.length < limit && remaining.length) {
    const top = remaining[0];
    const nearTies = remaining.filter((item) => top.score - item.score <= SCORE_NEAR_TIE);
    const pickedClusters = new Set(picked.flatMap((item) => item.clusters || []));

    let chosen = top;
    if (pickedClusters.size && nearTies.length > 1) {
      const divergent = nearTies.find((item) => {
        const clusters = item.clusters || [];
        if (!clusters.length) return false;
        return clusters.every((key) => !pickedClusters.has(key));
      });
      if (divergent) chosen = divergent;
    }

    picked.push(chosen);
    remaining.splice(remaining.indexOf(chosen), 1);
  }

  return picked;
}

/**
 * Filter scored courses for display: prefer Strong/Good; only keep Weak if pool is thin.
 * @template {{ score: number }} T
 * @param {T[]} scored
 * @param {number} [minCount=3]
 * @returns {T[]}
 */
export function filterByMatchConfidence(scored, minCount = 3) {
  const strongOrGood = scored.filter((item) => item.score >= GOOD_OPTION_MIN);
  if (strongOrGood.length >= minCount) return strongOrGood;
  return scored;
}

/**
 * @param {{ interestRatings?: Record<string, number>, styleRatings?: Record<string, number> }} answers
 * @returns {string}
 */
export function inferCareerTarget(answers = {}) {
  const { interestRatings = {}, styleRatings = {} } = answers;

  const ranked = Object.entries(interestRatings)
    .filter(([, rating]) => rating != null)
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length) {
    const [topKey, topRating] = ranked[0];
    const tied = ranked.filter(([, rating]) => rating === topRating).map(([key]) => key);

    if (styleRatings.researchVsProduct >= 4 && tied.includes("ai")) {
      return "Data scientist";
    }
    if (styleRatings.researchVsProduct >= 4 && tied.includes("bioinformatics")) {
      return "Data scientist";
    }
    if (styleRatings.researchVsProduct <= 2 && tied.includes("webMobile")) {
      return "Software developer";
    }

    return CAREER_BY_INTEREST[topKey] || "Data scientist";
  }

  if (styleRatings.researchVsProduct >= 4) return "Data scientist";
  if (styleRatings.handsOnVsTheory >= 4) return "Software developer";
  return "Data scientist";
}

/**
 * @param {Record<string, number>} interestRatings
 * @param {Record<string, number>} styleRatings
 * @param {string} registerTerm
 * @param {string} creditLoad
 * @param {string} note
 * @param {string} [careerTarget]
 * @param {string[]} [industries]
 * @param {{
 *   topicsEnjoyed?: string[],
 *   skillsHave?: string[],
 *   skillsWant?: string[],
 *   deliverables?: string[],
 * }} [multiSelect]
 */
export function buildReflectAnswers(
  interestRatings,
  styleRatings,
  registerTerm,
  creditLoad,
  note,
  careerTarget,
  industries = [],
  multiSelect = {}
) {
  return {
    interestRatings: { ...interestRatings },
    styleRatings: { ...styleRatings },
    registerTerm,
    creditLoad,
    note: note?.trim() || "",
    careerTarget,
    industries: [...industries],
    topicsEnjoyed: [...(multiSelect.topicsEnjoyed || [])],
    skillsHave: [...(multiSelect.skillsHave || [])],
    skillsWant: [...(multiSelect.skillsWant || [])],
    deliverables: [...(multiSelect.deliverables || [])],
  };
}

function formatRatingBlock(title, questions, ratings = {}) {
  const lines = questions
    .map((question) => {
      const rating = ratings[question.key];
      if (rating == null) return null;
      return `- ${question.prompt} → ${rating}/5`;
    })
    .filter(Boolean);

  if (!lines.length) return "";
  return `${title}:\n${lines.join("\n")}`;
}

/**
 * @param {Record<string, unknown>} answers
 * @returns {string}
 */
export function formatReflectAnswersForPrompt(answers = {}) {
  const lines = [];
  if (answers.registerTerm) lines.push(`Registration term: ${answers.registerTerm}`);
  if (answers.creditLoad) lines.push(`Target credit load: ${answers.creditLoad}`);

  const interestBlock = formatRatingBlock(
    "Interest by specialty (1=low, 5=high)",
    INTEREST_QUESTIONS,
    answers.interestRatings
  );
  if (interestBlock) lines.push(interestBlock);

  const styleBlock = formatRatingBlock(
    "Work style & comfort (1=low, 5=high)",
    STYLE_QUESTIONS,
    answers.styleRatings
  );
  if (styleBlock) lines.push(styleBlock);

  if (Array.isArray(answers.industries) && answers.industries.length) {
    const labels = answers.industries
      .map((key) => INDUSTRY_OPTIONS.find((opt) => opt.key === key)?.label || key)
      .join(", ");
    lines.push(`Industries of interest: ${labels}`);
  }

  if (Array.isArray(answers.topicsEnjoyed) && answers.topicsEnjoyed.length) {
    const labels = answers.topicsEnjoyed
      .map((key) => TOPIC_OPTIONS.find((opt) => opt.key === key)?.label || key)
      .join(", ");
    lines.push(`Topics enjoyed (up to 4): ${labels}`);
  }

  if (Array.isArray(answers.skillsHave) && answers.skillsHave.length) {
    const labels = answers.skillsHave
      .map((key) => SKILL_OPTIONS.find((opt) => opt.key === key)?.label || key)
      .join(", ");
    lines.push(`Skills already have: ${labels}`);
  }

  if (Array.isArray(answers.skillsWant) && answers.skillsWant.length) {
    const labels = answers.skillsWant
      .map((key) => SKILL_OPTIONS.find((opt) => opt.key === key)?.label || key)
      .join(", ");
    lines.push(`Skills to walk out with (up to 6): ${labels}`);
  }

  if (Array.isArray(answers.deliverables) && answers.deliverables.length) {
    const labels = answers.deliverables
      .map((key) => DELIVERABLE_OPTIONS.find((opt) => opt.key === key)?.label || key)
      .join(", ");
    lines.push(`Want to show an employer (up to 3): ${labels}`);
  }

  if (answers.note?.trim()) lines.push(`Additional note: ${answers.note.trim()}`);
  if (answers.careerTarget) lines.push(`Suggested career target: ${answers.careerTarget}`);
  return lines.join("\n");
}
