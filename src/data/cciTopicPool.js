import raw from "./cciTopicPool.json" with { type: "json" };
import { normalizeCode } from "./prerequisites.js";

/** @typedef {{ code: string, title: string, department?: string, blurb?: string, caveat?: string }} TopicEntry */

/** @type {Map<string, TopicEntry>} */
const TOPIC_BY_CODE = new Map();

for (const course of raw.courses) {
  TOPIC_BY_CODE.set(normalizeCode(course.code), course);
}

for (const course of raw.mathStatCognates?.courses ?? []) {
  const code = normalizeCode(course.code);
  if (!TOPIC_BY_CODE.has(code)) {
    TOPIC_BY_CODE.set(code, { ...course, department: "Math / Statistics (cognate)" });
  }
}

export const CCI_TOPIC_POOL_META = raw._meta;

/**
 * Look up a CCI catalog reference entry for topic-matching (not eligibility).
 * @param {string} code
 * @returns {TopicEntry | undefined}
 */
export function getTopicEntry(code) {
  return TOPIC_BY_CODE.get(normalizeCode(code));
}

/**
 * Merge catalog course fields with the CCI topic pool for Gemini prompts.
 * Eligibility still comes from prerequisites.js — this only enriches descriptions.
 *
 * @param {{ code: string, title: string, credits?: number, category?: string, blurb?: string }} course
 * @returns {{ code: string, title: string, credits?: number, category?: string, department?: string, blurb: string, caveat?: string }}
 */
export function enrichCourseForTopicMatching(course) {
  const topic = getTopicEntry(course.code);
  return {
    code: course.code,
    title: topic?.title || course.title,
    credits: course.credits,
    category: course.category,
    department: topic?.department,
    blurb: topic?.blurb || course.blurb || course.title,
    ...(topic?.caveat ? { caveat: topic.caveat } : {}),
  };
}
