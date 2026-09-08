import { getRulesForCourse, hasVerifiedRules, normalizeCode } from "../data/prerequisites.js";

const UNVERIFIED_PREREQ_MSG = "Prerequisites not verified for this course";

/**
 * @typedef {{ completed: string[], inProgress: string[] }} StudentRecord
 * @typedef {{ subject: string, number: string, title?: string, credits?: number, category?: string, blurb?: string }} CatalogCourse
 * @typedef {{ eligible: boolean, missingPrereqs: string[], missingCoreqs: string[], unverified?: boolean }} EligibilityResult
 */

/**
 * @param {StudentRecord} record
 * @param {string} code
 * @returns {boolean}
 */
function hasCompleted(record, code) {
  return record.completed.includes(normalizeCode(code));
}

/**
 * @param {StudentRecord} record
 * @param {string} code
 * @returns {boolean}
 */
function hasCompletedOrInProgress(record, code) {
  const normalized = normalizeCode(code);
  return record.completed.includes(normalized) || record.inProgress.includes(normalized);
}

/**
 * @param {import("../data/prerequisites.js").Rule} rule
 * @param {StudentRecord} record
 * @param {(record: StudentRecord, code: string) => boolean} [isSatisfied]
 * @returns {boolean}
 */
function satisfiesRule(rule, record, isSatisfied = hasCompleted) {
  if (typeof rule === "string") return isSatisfied(record, rule);
  if (rule.all) return rule.all.every((r) => satisfiesRule(r, record, isSatisfied));
  if (rule.oneOf) return rule.oneOf.some((r) => satisfiesRule(r, record, isSatisfied));
  return false;
}

/**
 * @param {import("../data/prerequisites.js").Rule} rule
 * @param {StudentRecord} record
 * @param {(record: StudentRecord, code: string) => boolean} [isSatisfied]
 * @returns {string[]}
 */
function missingFromRule(rule, record, isSatisfied = hasCompleted) {
  if (typeof rule === "string") {
    return isSatisfied(record, rule) ? [] : [normalizeCode(rule)];
  }
  if (rule.all) {
    return rule.all.flatMap((r) => missingFromRule(r, record, isSatisfied));
  }
  if (rule.oneOf) {
    if (rule.oneOf.some((r) => satisfiesRule(r, record, isSatisfied))) return [];
    const options = rule.oneOf.map((r) =>
      typeof r === "string" ? normalizeCode(r) : describeRule(r)
    );
    return [`One of: ${options.join(", ")}`];
  }
  return [];
}

/**
 * @param {import("../data/prerequisites.js").Rule} rule
 * @returns {string}
 */
function describeRule(rule) {
  if (typeof rule === "string") return rule;
  if (rule.all) return rule.all.map(describeRule).join(" AND ");
  if (rule.oneOf) return rule.oneOf.map(describeRule).join(" OR ");
  return "?";
}

/**
 * Decide whether a student may take a course.
 * @param {string} courseCode
 * @param {StudentRecord} record
 * @returns {EligibilityResult}
 */
export function checkEligibility(courseCode, record) {
  const normalized = normalizeCode(courseCode);
  if (record.completed.includes(normalized)) {
    return { eligible: false, missingPrereqs: [], missingCoreqs: [] };
  }
  if (record.inProgress.includes(normalized)) {
    return { eligible: false, missingPrereqs: [], missingCoreqs: [] };
  }

  if (!hasVerifiedRules(normalized)) {
    return {
      eligible: false,
      missingPrereqs: [UNVERIFIED_PREREQ_MSG],
      missingCoreqs: [],
      unverified: true,
    };
  }

  const rules = getRulesForCourse(normalized);
  if (!rules) {
    return {
      eligible: false,
      missingPrereqs: [UNVERIFIED_PREREQ_MSG],
      missingCoreqs: [],
      unverified: true,
    };
  }

  const { prereqs, coreqs } = rules;
  const missingPrereqs = prereqs.flatMap((rule) => missingFromRule(rule, record));
  const missingCoreqs = coreqs.flatMap((rule) =>
    missingFromRule(rule, record, hasCompletedOrInProgress)
  );

  const eligible = missingPrereqs.length === 0 && missingCoreqs.length === 0;
  return { eligible, missingPrereqs, missingCoreqs };
}

/**
 * @param {CatalogCourse[]} catalog
 * @param {StudentRecord} record
 * @returns {CatalogCourse[]}
 */
export function getEligibleCourses(catalog, record) {
  return catalog.filter((course) => {
    const code = normalizeCode(`${course.subject} ${course.number}`);
    return checkEligibility(code, record).eligible;
  });
}

/**
 * @param {string[]} codes
 * @param {CatalogCourse[]} eligibleCatalog
 * @returns {string[]}
 */
export function filterToEligibleCodes(codes, eligibleCatalog) {
  const eligibleSet = new Set(
    eligibleCatalog.map((c) => normalizeCode(`${c.subject} ${c.number}`))
  );
  return codes
    .map((code) => normalizeCode(code))
    .filter((code) => eligibleSet.has(code));
}

/**
 * Catalog courses that exist in COURSES but lack verified prerequisite data.
 * @param {CatalogCourse[]} catalog
 * @returns {Array<{ code: string, title: string, category?: string }>}
 */
export function listUnverifiedCatalogCourses(catalog) {
  return catalog
    .map((c) => ({
      code: normalizeCode(`${c.subject} ${c.number}`),
      title: c.title || "",
      category: c.category,
    }))
    .filter((c) => !hasVerifiedRules(c.code))
    .sort((a, b) => a.code.localeCompare(b.code));
}
