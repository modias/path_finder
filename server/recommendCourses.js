import { SchemaType } from "@google/generative-ai";
import { COURSES } from "../src/data/courseCatalog.js";
import { enrichCourseForTopicMatching } from "../src/data/cciTopicPool.js";
import { buildStudentRecord } from "../src/lib/studentRecord.js";
import { getEligibleCourses } from "../src/lib/eligibility.js";
import { normalizeCode } from "../src/data/prerequisites.js";
import {
  describeCourseMatch,
  filterByMatchConfidence,
  GOOD_OPTION_MIN,
  matchPercentFromScore,
  pickCoursesBySpecializePreference,
  relatednessToReflectAnswers,
  scoreCourseForReflectDetail,
  STRONG_MATCH_MIN,
} from "../src/lib/reflectScoring.js";
import { getSyllabusText } from "../lib/syllabusLookup.js";

const FALLBACK_REASON =
  "Matches your current eligibility — couldn't generate a personalized explanation right now";

const GEMINI_TIMEOUT_MS = 30_000;
const PROMPT_SHORTLIST_LIMIT = 20;
/** Minimum courses to show when enough eligible options exist. */
export const MIN_RECOMMENDATIONS = 3;
const DEGREE_PROGRESS_CATEGORIES = new Set(["core", "computing", "capstone"]);

/** Never suggest these required studio / support codes (even if eligible). */
export const RECOMMENDATION_BLOCKLIST = new Set(
  [
    "DTSC 1301",
    "DTSC 1302",
    "DTSC 2301",
    "DTSC 2302",
    "DTSC 3601",
    "DTSC 3602",
    "DTSC 4301",
    "DTSC 4302",
    "MATH 1120",
    "MATH 1241",
    "STAT 1220",
    "STAT 1221",
    "STAT 1222",
    "MATH 2164",
    "STAT 2223",
    "STAT 3160",
    "ITSC 1213",
    "ITSC 2175",
    "MATH 1165",
    "ITSC 2214",
    "ITCS 3162",
    "ITCS 3160",
    "ITSC 1212",
  ].map(normalizeCode)
);

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini request timed out")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const EXPLANATION_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    courses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          code: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["code", "reason"],
      },
    },
  },
  required: ["courses"],
};

/**
 * @param {unknown} creditLoad
 * @returns {{ min: number, max: number, target: number } | null}
 */
export function parseCreditLoadHours(creditLoad) {
  const text = String(creditLoad || "");
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    return { min, max, target: max };
  }
  const single = text.match(/(\d+)/);
  if (!single) return null;
  const target = Number(single[1]);
  return { min: target, max: target, target };
}

/**
 * @param {{ subject: string, number: string|number }} course
 * @returns {string}
 */
function courseCode(course) {
  return normalizeCode(`${course.subject} ${course.number}`);
}

/**
 * @param {string} code
 * @returns {boolean}
 */
export function isBlockedFromRecommendation(code) {
  return RECOMMENDATION_BLOCKLIST.has(normalizeCode(code));
}

/**
 * @param {Array<{ subject: string, number: string|number }>} courses
 */
export function excludeBlockedRecommendations(courses) {
  return courses.filter((course) => !isBlockedFromRecommendation(courseCode(course)));
}

/**
 * Rank eligible catalog rows for prompting: Strong match (≥75% / ≥4) first, then
 * Good option (≥50% / ≥3), then remaining core/computing/capstone, then other
 * electives. Weak matches (<50%) only fill when the pool is too thin.
 *
 * @param {Array<{ subject: string, number: string|number, title: string, credits: number, category?: string, blurb?: string }>} eligible
 * @param {Record<string, unknown>} answers
 * @param {number} [limit]
 */
export function shortlistEligibleCourses(
  eligible,
  answers = {},
  limit = PROMPT_SHORTLIST_LIMIT
) {
  const recommendable = excludeBlockedRecommendations(eligible);
  const scored = recommendable.map((course) => {
    const code = courseCode(course);
    const detail = scoreCourseForReflectDetail(code, answers);
    return { course, code, ...detail };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    const relatedDelta =
      relatednessToReflectAnswers(b.code, answers) - relatednessToReflectAnswers(a.code, answers);
    if (relatedDelta) return relatedDelta;

    const aProgress = DEGREE_PROGRESS_CATEGORIES.has(a.course.category) ? 0 : 1;
    const bProgress = DEGREE_PROGRESS_CATEGORIES.has(b.course.category) ? 0 : 1;
    if (aProgress !== bProgress) return aProgress - bProgress;

    const aElective = a.course.category === "outside_elective" ? 0 : 1;
    const bElective = b.course.category === "outside_elective" ? 0 : 1;
    if (aElective !== bElective) return aElective - bElective;

    return a.code.localeCompare(b.code);
  });

  // Neutral gen-eds score 3/5 with no Reflect drivers and look like "Good options".
  // Keep them out of the confidence pool so they cannot crowd out electives.
  const withoutUnratedGenEd = scored.filter(
    (entry) => entry.course.category !== "gen_ed" || entry.drivers.length > 0
  );
  const preferred = filterByMatchConfidence(
    withoutUnratedGenEd,
    Math.min(MIN_RECOMMENDATIONS, withoutUnratedGenEd.length)
  );
  const pool = preferred.length ? preferred : withoutUnratedGenEd;
  const minCount = Math.min(MIN_RECOMMENDATIONS, limit, scored.length);

  const picked = [];
  const seen = new Set();

  const take = (entry) => {
    if (seen.has(entry.code) || picked.length >= limit) return;
    seen.add(entry.code);
    picked.push(entry.course);
  };

  for (const entry of pool) {
    if (entry.score >= STRONG_MATCH_MIN && entry.course.category !== "gen_ed") {
      take(entry);
    }
  }
  for (const entry of pool) {
    if (entry.score >= GOOD_OPTION_MIN && entry.course.category !== "gen_ed") {
      take(entry);
    }
  }
  for (const entry of pool) {
    if (DEGREE_PROGRESS_CATEGORIES.has(entry.course.category)) take(entry);
  }
  for (const entry of scored) {
    if (entry.course.category === "outside_elective") take(entry);
  }

  if (picked.length < minCount) {
    for (const entry of scored) {
      if (DEGREE_PROGRESS_CATEGORIES.has(entry.course.category)) take(entry);
    }
  }
  // Gen-ed only fills leftover slots when nothing stronger made the shortlist.
  if (picked.length < minCount) {
    for (const entry of scored) take(entry);
  }

  return picked;
}

/**
 * @param {{ subject: string, number: string|number, title: string, credits: number, category?: string }} course
 * @param {Record<string, unknown>} answers
 * @returns {string}
 */
export function fallbackReasonForCourse(course, answers = {}) {
  const matches = describeCourseMatch(courseCode(course), answers).filter(
    (match) => match.rating >= 4
  );
  if (matches.length) {
    return `Fits your interest in ${matches[0].label} (${matches[0].rating}/5), and you're eligible to take it now.`;
  }
  if (DEGREE_PROGRESS_CATEGORIES.has(course.category)) {
    return "A remaining degree-progress course you're eligible for this term.";
  }
  return FALLBACK_REASON;
}

/**
 * @param {Array<{ subject: string, number: string|number, title: string, credits: number, category?: string, blurb?: string }>} eligible
 * @param {Record<string, unknown>} [answers]
 * @returns {Array<{ code: string, title: string, credits: number, category?: string, blurb?: string, matchScore: number, matchPercent: number, matchLabel: string, scoreDrivers: string[], matchedSpecialties: string[] }>}
 */
export function toEligibleSummaries(eligible, answers = {}) {
  return eligible.map((c) => {
    const code = courseCode(c);
    const enriched = enrichCourseForTopicMatching({
      code,
      title: c.title,
      credits: c.credits,
      category: c.category,
      blurb: c.blurb,
    });
    const detail = scoreCourseForReflectDetail(code, answers);
    const matches = describeCourseMatch(code, answers);
    const matchPercent = detail.matchPercent ?? matchPercentFromScore(detail.score);
    const scoreDrivers =
      detail.drivers.length > 0
        ? [...detail.drivers, `${matchPercent}% match`]
        : [`${matchPercent}% match`];
    return {
      ...enriched,
      // Gemini sees 0–100% here (Rule 9 / Rule 10); ranking still used the 1–5 score.
      matchScore: matchPercent,
      matchPercent,
      matchLabel: detail.label,
      scoreDrivers,
      matchedSpecialties: matches
        .filter((match) => match.rating >= 4)
        .map((match) => `${match.label} (${match.rating}/5)`),
    };
  });
}

/**
 * Eligible shortlist + match scores for advisor chat (still filtered by eligibility).
 * @param {Record<string, unknown>} [answers]
 */
export function buildAdvisorCourseContext(answers = {}) {
  const record = buildStudentRecord();
  const eligible = getEligibleCourses(COURSES, record);
  const shortlist = shortlistEligibleCourses(eligible, answers);
  return {
    eligibleNow: toEligibleSummaries(shortlist, answers),
    reminder:
      "Only suggest course codes from eligibleNow. That list is already filtered for prerequisites and excludes required studio/support courses that should not be recommended.",
  };
}

/**
 * Deterministic ranking of eligible courses from Reflect answers.
 * @param {Array<{ subject: string, number: string|number, title: string, credits: number, category?: string }>} eligible
 * @param {string} [summary]
 * @returns {{ summary: string, recommendations: Array<{ code: string, title: string, credits: number, category?: string, reason: string }>, eligibleCount: number }}
 */
export function buildFallbackRecommendations(
  eligible,
  summary,
  answers = {}
) {
  const sorted = shortlistEligibleCourses(eligible, answers);
  const scored = sorted.map((c) => {
    const code = courseCode(c);
    const detail = scoreCourseForReflectDetail(code, answers);
    return { course: c, code, ...detail };
  });
  const picked = pickCoursesBySpecializePreference(scored, answers, 5);

  const recommendations = picked.map(({ course: c, code, score, matchPercent, label, drivers }) => {
    const percent = matchPercent ?? matchPercentFromScore(score);
    return {
      code,
      title: c.title,
      credits: c.credits,
      category: c.category,
      matchPercent: percent,
      matchLabel: label,
      reason:
        drivers.length > 0
          ? `${drivers.join("; ")} → ${percent}% match. You're eligible to take it now.`
          : fallbackReasonForCourse(c, answers),
    };
  });

  const strong = recommendations.filter((rec) => (rec.matchPercent ?? 0) >= 75);
  const defaultSummary = strong.length
    ? `Your Reflect answers point to ${recommendations.length} eligible electives. ${strong[0].code} is the strongest match.`
    : `Here are ${recommendations.length} eligible electives ranked from your Reflect answers.`;

  return {
    summary: summary || defaultSummary,
    recommendations: packRecommendationsToLoad(recommendations, answers),
    eligibleCount: eligible.length,
  };
}

/**
 * Drop extras once the student's credit-load cap is reached.
 * Still keeps at least MIN_RECOMMENDATIONS when that many were supplied.
 * @param {Array<{ code: string, title: string, credits: number, category?: string, reason: string }>} recommendations
 * @param {Record<string, unknown>} answers
 */
export function packRecommendationsToLoad(recommendations, answers = {}) {
  const creditHours = parseCreditLoadHours(answers.creditLoad);
  if (!creditHours || !recommendations.length) return recommendations;

  const minKeep = Math.min(MIN_RECOMMENDATIONS, recommendations.length);
  const packed = [];
  let total = 0;
  for (const rec of recommendations) {
    const credits = rec.credits || 3;
    if (packed.length >= 5) break;
    // Always keep the first minKeep options; credit cap applies after that.
    if (packed.length >= minKeep && total + credits > creditHours.max) continue;
    packed.push(rec);
    total += credits;
  }
  return packed.length ? packed : recommendations.slice(0, minKeep);
}

/**
 * Score trail handed to the explanation step. This does not rescore the course.
 * @param {string} code
 * @param {Record<string, unknown>} answers
 * @param {{ matchPercent?: number, matchLabel?: string }} rec
 * @returns {string}
 */
function scoreTrailFor(code, answers, rec) {
  const detail = scoreCourseForReflectDetail(code, answers);
  const percent = rec.matchPercent ?? detail.matchPercent ?? matchPercentFromScore(detail.score);
  const label = rec.matchLabel || detail.label;
  if (detail.drivers.length) {
    return `${detail.drivers.join("; ")} → ${percent}% match (${label})`;
  }
  return `${percent}% match (${label})`;
}

/**
 * Prompt for the post-selection explanation call. The course list is the
 * already chosen 3–5, not the eligible shortlist.
 * @param {Array<{ rec: { code: string, title?: string, matchPercent?: number, matchLabel?: string }, syllabusText: string }>} courses
 * @param {Record<string, unknown>} answers
 * @returns {string}
 */
export function buildSyllabusExplanationPrompt(courses, answers = {}) {
  const payload = courses.map(({ rec, syllabusText }) => ({
    code: rec.code,
    title: rec.title,
    scoreTrail: scoreTrailFor(rec.code, answers, rec),
    syllabusText,
  }));

  return `SYLLABUS_EXPLANATION_STEP
These courses were already selected. Do not add, drop, replace, or reorder course codes.
Write one sentence per course for "reason". Describe what the course actually covers using syllabusText, and connect that content to scoreTrail. Do not invent topics that are not in syllabusText.

Return JSON only: {"courses":[{"code":"SUBJ 1234","reason":"one sentence"}]}

SELECTED_COURSES:
${JSON.stringify(payload, null, 2)}`;
}

/**
 * @param {string} text
 * @returns {Map<string, string>}
 */
function parseExplanationReasons(text) {
  /** @type {Map<string, string>} */
  const reasons = new Map();
  try {
    const jsonText = String(text || "")
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(jsonText);
    for (const course of parsed.courses || []) {
      const reason = String(course?.reason || "").trim();
      if (!course?.code || !reason) continue;
      reasons.set(normalizeCode(course.code), reason);
    }
  } catch {
    return reasons;
  }
  return reasons;
}

/**
 * After selection is final, rewrite explanation sentences with syllabus text.
 * Codes, match scores, and order are copied from `selection` and never taken
 * from this model's response. Courses with no indexed syllabus keep their
 * existing score-trail reason.
 *
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {{ summary: string, recommendations: Array<{ code: string, title: string, credits: number, category?: string, matchPercent?: number, matchLabel?: string, reason: string }>, eligibleCount: number }} selection
 * @param {Record<string, unknown>} [answers]
 */
export async function groundExplanationsWithSyllabus(genAI, selection, answers = {}) {
  const recommendations = selection.recommendations || [];
  const withSyllabus = recommendations.flatMap((rec) => {
    const syllabusText = getSyllabusText(rec.code);
    return syllabusText ? [{ rec, syllabusText }] : [];
  });
  if (!withSyllabus.length || !genAI) return selection;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction:
        "You explain courses that were already selected. Do not add, remove, or replace course codes.",
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: EXPLANATION_RESPONSE_SCHEMA,
      },
    });
    const result = await withTimeout(
      model.generateContent(buildSyllabusExplanationPrompt(withSyllabus, answers)),
      GEMINI_TIMEOUT_MS
    );
    const reasons = parseExplanationReasons(result.response.text());
    const sent = new Set(withSyllabus.map((entry) => normalizeCode(entry.rec.code)));
    return {
      ...selection,
      recommendations: recommendations.map((rec) => {
        const code = normalizeCode(rec.code);
        const reason = reasons.get(code);
        if (!sent.has(code) || !reason) return rec;
        return { ...rec, reason };
      }),
    };
  } catch (err) {
    console.error("Syllabus explanation Gemini error:", err?.message || err);
    return selection;
  }
}

/**
 * Tag each recommendation with whether its reason was rewritten from syllabus
 * text. A reason only counts as grounded if it changed and the course has an
 * indexed syllabus, so fallback score-trail reasons are never mislabeled.
 *
 * @template {{ code: string, reason: string }} R
 * @param {{ recommendations?: R[] }} before
 * @param {{ recommendations?: R[] }} after
 */
export function markSyllabusGrounded(before, after) {
  const priorReasons = new Map(
    (before.recommendations || []).map((rec) => [normalizeCode(rec.code), rec.reason])
  );
  return {
    ...after,
    recommendations: (after.recommendations || []).map((rec) => {
      const code = normalizeCode(rec.code);
      const syllabusGrounded =
        Boolean(rec.reason) &&
        priorReasons.has(code) &&
        rec.reason !== priorReasons.get(code) &&
        getSyllabusText(code) != null;
      return { ...rec, syllabusGrounded };
    }),
  };
}

/**
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {{ answers: Record<string, unknown> }} params
 * @returns {Promise<{ summary: string, recommendations: Array<{ code: string, title: string, credits: number, category?: string, reason: string }>, eligibleCount: number }>}
 */
export async function recommendCourses(genAI, { answers = {} }) {
  const record = buildStudentRecord();
  const eligible = getEligibleCourses(COURSES, record);
  // Rank in code from Reflect answers. Gemini may rewrite reasons from
  // syllabi, but it must not pick or reorder the courses — that was returning
  // the same 3 electives regardless of what the student rated.
  const selected = buildFallbackRecommendations(eligible, undefined, answers);
  const grounded = await groundExplanationsWithSyllabus(genAI, selected, answers);
  return markSyllabusGrounded(selected, grounded);
}
