import { SchemaType } from "@google/generative-ai";
import { COURSES } from "../src/data/courseCatalog.js";
import { enrichCourseForTopicMatching } from "../src/data/cciTopicPool.js";
import { buildStudentRecord } from "../src/lib/studentRecord.js";
import {
  getEligibleCourses,
  filterToEligibleCodes,
} from "../src/lib/eligibility.js";
import { normalizeCode } from "../src/data/prerequisites.js";
import {
  describeCourseMatch,
  filterByMatchConfidence,
  formatReflectAnswersForPrompt,
  GOOD_OPTION_MIN,
  matchPercentFromScore,
  pickCoursesBySpecializePreference,
  scoreCourseForReflectDetail,
  STRONG_MATCH_MIN,
} from "../src/lib/reflectScoring.js";

const FALLBACK_REASON =
  "Matches your current eligibility — couldn't generate a personalized explanation right now";

const GEMINI_TIMEOUT_MS = 30_000;
const PROMPT_SHORTLIST_LIMIT = 20;
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
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Gemini request timed out")), ms);
    }),
  ]);
}

const RECOMMENDATION_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
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
  required: ["summary", "courses"],
};

/**
 * @param {Record<string, unknown>} answers
 * @returns {string}
 */
export function formatAnswersForPrompt(answers = {}) {
  return formatReflectAnswersForPrompt(answers);
}

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
 * Rank eligible catalog rows for prompting: Strong match (≥4) first, then Good
 * option (≥3), then remaining core/computing/capstone, then other electives.
 * Weak matches (<3) only fill when the pool is too thin (Rule 9).
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

    const aProgress = DEGREE_PROGRESS_CATEGORIES.has(a.course.category) ? 0 : 1;
    const bProgress = DEGREE_PROGRESS_CATEGORIES.has(b.course.category) ? 0 : 1;
    if (aProgress !== bProgress) return aProgress - bProgress;

    const aElective = a.course.category === "outside_elective" ? 0 : 1;
    const bElective = b.course.category === "outside_elective" ? 0 : 1;
    if (aElective !== bElective) return aElective - bElective;

    return a.code.localeCompare(b.code);
  });

  const preferred = filterByMatchConfidence(scored, Math.min(3, scored.length));
  const pool = preferred.length ? preferred : scored;

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
  for (const entry of pool) {
    if (entry.course.category === "outside_elective") take(entry);
  }
  // Gen-ed only fills leftover slots when nothing stronger made the shortlist.
  if (picked.length === 0) {
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
 * @returns {Array<{ code: string, title: string, credits: number, category?: string, blurb?: string, matchScore: number, matchLabel: string, scoreDrivers: string[], matchedSpecialties: string[] }>}
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
    return {
      ...enriched,
      matchScore: Number(detail.score.toFixed(2)),
      matchLabel: detail.label,
      scoreDrivers: detail.drivers,
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
 * Builds the system instruction / prompt text for Gemini.
 * The course list is always the filtered eligible set — never the full catalog.
 *
 * @param {{ eligible: Array<{ subject: string, number: string|number, title: string, credits: number, category?: string, blurb?: string }>, answers?: Record<string, unknown> }} params
 * @returns {string}
 */
export function buildRecommendPrompt({ eligible, answers = {} }) {
  const shortlist = shortlistEligibleCourses(eligible, answers);
  const eligibleSummaries = toEligibleSummaries(shortlist, answers);
  const creditHours = parseCreditLoadHours(answers.creditLoad);
  const creditLine = creditHours
    ? `Aim for about ${creditHours.target} total credits (stay between ${creditHours.min} and ${creditHours.max} if possible; do not exceed ${creditHours.max} by more than one course).`
    : "Keep the total credits of your recommendations close to the student's stated credit load, without exceeding it by more than one course.";

  return `You are a course recommendation assistant for UNC Charlotte's B.S. Data Science program. You will be given a shortlist of courses the student is CURRENTLY ELIGIBLE to register for — this list has already been filtered for prerequisites and corequisites and ranked by matchScore (1–5, computed in code). Treat it as the complete and only set of valid choices. Each course includes matchLabel ("Strong match" or "Good option"), scoreDrivers (the specific Reflect answers that drove the score), department/topic blurbs, and matchedSpecialties when a rating is 4/5 or 5/5.

Recommend 3-5 courses from ELIGIBLE_COURSES that best fit the student, in priority order. Prefer higher matchScore / "Strong match" courses first. Prefer "Good option" over weaker entries. Prefer remaining core / computing / capstone courses over gen-ed when matchScore is similar. ${creditLine}

Rules:
- Only recommend courses from the ELIGIBLE_COURSES list below. Do not invent, abbreviate, or guess a course code that isn't in that list.
- Never recommend required studio sequence or listed support courses that were removed from this shortlist (for example DTSC 1301–4302, ITSC 1213/2175/2214, ITCS 3160/3162, STAT 1222/2223/3160, MATH 1120/1241/1165/2164).
- If fewer than 3 eligible courses are available, recommend as many as exist and say so in "summary" rather than padding with invalid codes.
- Do not pad the list with unmatched gen-ed courses when stronger specialty matches are on the shortlist.
- In each course "reason", cite the actual driving answer from scoreDrivers (or matchedSpecialties). Do not invent drivers and do not write generic "you're eligible" reasons.
- Respond with JSON only — no markdown formatting, no prose outside the JSON object, matching exactly this shape:
{"summary":"one or two sentences of overall guidance","courses":[{"code":"SUBJ 1234","reason":"one sentence tailored to this student"}]}

ELIGIBLE_COURSES (ranked, best match first):
${JSON.stringify(eligibleSummaries, null, 2)}

STUDENT_ANSWERS:
${formatAnswersForPrompt(answers)}`;
}

/**
 * Deterministic fallback when the model response can't be parsed (or yields nothing usable).
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

  const recommendations = picked.map(({ course: c, code, score, label, drivers }) => ({
    code,
    title: c.title,
    credits: c.credits,
    category: c.category,
    matchPercent: matchPercentFromScore(score),
    matchLabel: label,
    reason:
      drivers.length > 0
        ? `${drivers.join("; ")}. You're eligible to take it now.`
        : fallbackReasonForCourse(c, answers),
  }));

  const defaultSummary =
    recommendations.some((rec) => rec.category === "outside_elective")
      ? "Personalized AI explanations aren't available right now — here are eligible electives ranked from your Reflect ratings."
      : "Personalized AI explanations aren't available right now. Specialty electives may still be blocked until their prerequisites are verified — here are the eligible options left.";

  return {
    summary: summary || defaultSummary,
    recommendations: packRecommendationsToLoad(recommendations, answers),
    eligibleCount: eligible.length,
  };
}

/**
 * Drop extras once the student's credit-load cap is reached.
 * @param {Array<{ code: string, title: string, credits: number, category?: string, reason: string }>} recommendations
 * @param {Record<string, unknown>} answers
 */
export function packRecommendationsToLoad(recommendations, answers = {}) {
  const creditHours = parseCreditLoadHours(answers.creditLoad);
  if (!creditHours || !recommendations.length) return recommendations;

  const packed = [];
  let total = 0;
  for (const rec of recommendations) {
    const credits = rec.credits || 3;
    if (packed.length >= 5) break;
    if (packed.length > 0 && total + credits > creditHours.max) continue;
    packed.push(rec);
    total += credits;
  }
  return packed.length ? packed : recommendations.slice(0, 1);
}

/**
 * Parse model text, filter to eligible codes, and assemble the API payload.
 * On JSON parse failure, returns a deterministic fallback from eligible — never throws.
 *
 * @param {string} text
 * @param {Array<{ subject: string, number: string|number, title: string, credits: number, category?: string, blurb?: string }>} eligible
 * @returns {{ summary: string, recommendations: Array<{ code: string, title: string, credits: number, category?: string, reason: string }>, eligibleCount: number }}
 */
export function finalizeRecommendationsFromText(text, eligible, answers = {}) {
  const eligibleSummaries = toEligibleSummaries(eligible, answers);
  const eligibleByCode = new Map(eligibleSummaries.map((c) => [c.code, c]));

  let parsed;
  try {
    const jsonText = String(text || "")
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(jsonText);
  } catch {
    return buildFallbackRecommendations(eligible, undefined, answers);
  }

  const rawCodes = (parsed.courses || []).map((c) => c.code).filter(Boolean);
  const filteredCodes = filterToEligibleCodes(rawCodes, eligible).filter(
    (code) => !isBlockedFromRecommendation(code)
  );

  const recommendations = filteredCodes.map((code) => {
    const catalog = eligibleByCode.get(code);
    const fromModel = (parsed.courses || []).find(
      (c) => normalizeCode(c.code) === code
    );
    const detail = scoreCourseForReflectDetail(code, answers);
    return {
      code,
      title: catalog?.title || code,
      credits: catalog?.credits || 3,
      category: catalog?.category,
      matchPercent: matchPercentFromScore(detail.score),
      matchLabel: detail.label,
      score: detail.score,
      clusters: detail.clusters,
      reason: fromModel?.reason || "Matches your interests and remaining degree requirements.",
    };
  });

  recommendations.sort((a, b) => (b.score || 0) - (a.score || 0));
  const diversified = pickCoursesBySpecializePreference(recommendations, answers, 5).map(
    ({ score, clusters, ...rest }) => rest
  );

  let summary =
    parsed.summary || "Here are eligible courses that fit your preferences.";
  if (diversified.length === 0) {
    summary =
      parsed.summary?.trim() ||
      "No personalized course matches came back from the eligible list for this term. Try adjusting your interests or credit load, or browse the catalog for eligible options.";
  }

  return {
    summary,
    recommendations: packRecommendationsToLoad(diversified, answers),
    eligibleCount: eligible.length,
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
  const systemInstruction = buildRecommendPrompt({ eligible, answers });

  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: RECOMMENDATION_RESPONSE_SCHEMA,
    },
  });

  let text;
  try {
    const result = await withTimeout(
      model.generateContent(
        "Recommend 3-5 courses from the ranked ELIGIBLE_COURSES shortlist. Prefer Strong match / high matchScore and cite scoreDrivers in each reason. Keep total credits near the student's target load. Return JSON only."
      ),
      GEMINI_TIMEOUT_MS
    );
    text = result.response.text().trim();
  } catch (err) {
    // Network errors, bad API key, rate limits, rejected responseSchema, etc.
    console.error(
      "Recommend courses Gemini error:",
      err?.message || err
    );
    return buildFallbackRecommendations(eligible, undefined, answers);
  }

  return finalizeRecommendationsFromText(text, eligible, answers);
}
