import { getRulesForCourse, normalizeCode } from "../data/prerequisites.js";

/**
 * @typedef {{ completed: string[], inProgress: string[] }} StudentRecord
 * @typedef {{ subject: string, number: string, title?: string, credits?: number, category?: string, blurb?: string }} CatalogCourse
 * @typedef {{ eligible: boolean, missingPrereqs: string[], missingCoreqs: string[] }} EligibilityResult
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
 * @returns {boolean}
 */
function satisfiesRule(rule, record) {
  if (typeof rule === "string") return hasCompleted(record, rule);
  if (rule.all) return rule.all.every((r) => satisfiesRule(r, record));
  if (rule.oneOf) return rule.oneOf.some((r) => satisfiesRule(r, record));
  return false;
}

/**
 * @param {import("../data/prerequisites.js").Rule} rule
 * @param {StudentRecord} record
 * @returns {string[]}
 */
function missingFromRule(rule, record) {
  if (typeof rule === "string") return hasCompleted(record, rule) ? [] : [normalizeCode(rule)];
  if (rule.all) {
    return rule.all.flatMap((r) => missingFromRule(r, record));
  }
  if (rule.oneOf) {
    const satisfied = rule.oneOf.some((r) => satisfiesRule(r, record));
    if (satisfied) return [];
    const options = rule.oneOf.flatMap((r) => {
      if (typeof r === "string") return [normalizeCode(r)];
      return [`(${describeRule(r)})`];
    });
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

  const { prereqs, coreqs } = getRulesForCourse(normalized);
  const missingPrereqs = prereqs.flatMap((rule) => missingFromRule(rule, record));
  const missingCoreqs = coreqs.filter((code) => !hasCompletedOrInProgress(record, code));

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
