import { COURSES } from "../src/data/courseCatalog.js";
import { buildStudentRecord } from "../src/lib/studentRecord.js";
import {
  getEligibleCourses,
  filterToEligibleCodes,
} from "../src/lib/eligibility.js";
import { normalizeCode } from "../src/data/prerequisites.js";

/**
 * @param {Record<string, unknown>} answers
 * @returns {string}
 */
export function formatAnswersForPrompt(answers = {}) {
  const lines = [];
  if (answers.registerTerm) lines.push(`Registration term: ${answers.registerTerm}`);
  if (answers.creditLoad) lines.push(`Target credit load: ${answers.creditLoad}`);
  if (answers.interests?.length) lines.push(`Interests: ${answers.interests.join(", ")}`);
  if (answers.values?.length) lines.push(`Values: ${answers.values.join(", ")}`);
  if (answers.strengths?.length) lines.push(`Strengths: ${answers.strengths.join(", ")}`);
  if (answers.note?.trim()) lines.push(`Reflection: ${answers.note.trim()}`);
  if (answers.careerTarget) lines.push(`Suggested career target: ${answers.careerTarget}`);
  return lines.join("\n");
}

/**
 * @param {import("@google/generative-ai").GoogleGenerativeAI} genAI
 * @param {{ answers: Record<string, unknown> }} params
 * @returns {Promise<{ summary: string, recommendations: Array<{ code: string, title: string, credits: number, category?: string, reason: string }> }>}
 */
export async function recommendCourses(genAI, { answers = {} }) {
  const record = buildStudentRecord();
  const eligible = getEligibleCourses(COURSES, record);
  const eligibleSummaries = eligible.map((c) => ({
    code: normalizeCode(`${c.subject} ${c.number}`),
    title: c.title,
    credits: c.credits,
    category: c.category,
    blurb: c.blurb,
  }));

  const eligibleByCode = new Map(eligibleSummaries.map((c) => [c.code, c]));

  const systemInstruction = `You are a course advisor for UNC Charlotte's B.S. Data Science prototype app.

RULES:
- You may ONLY recommend courses from the ELIGIBLE COURSES list below. Never invent codes.
- Choose courses that fit the student's term, credit load, interests, values, and strengths.
- Respect the target credit load — prefer a schedule near that total, not far above it.
- Return ONLY valid JSON (no markdown fences) in this shape:
{"summary":"1-2 sentence overview","courses":[{"code":"SUBJ 1234","reason":"short why"}]}
- Include 3-6 courses when possible. If nothing fits, return an empty courses array with an explanatory summary.

ELIGIBLE COURSES (prerequisite-checked — do not question eligibility):
${JSON.stringify(eligibleSummaries, null, 2)}

STUDENT ANSWERS:
${formatAnswersForPrompt(answers)}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  const result = await model.generateContent(
    "Recommend courses for the student's chosen registration term. Return JSON only."
  );
  const text = result.response.text().trim();

  let parsed;
  try {
    const jsonText = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Failed to parse recommendation response.");
  }

  const rawCodes = (parsed.courses || []).map((c) => c.code).filter(Boolean);
  const filteredCodes = filterToEligibleCodes(rawCodes, eligible);

  const recommendations = filteredCodes.map((code) => {
    const catalog = eligibleByCode.get(code);
    const fromModel = (parsed.courses || []).find(
      (c) => normalizeCode(c.code) === code
    );
    return {
      code,
      title: catalog?.title || code,
      credits: catalog?.credits || 3,
      category: catalog?.category,
      reason: fromModel?.reason || "Matches your interests and remaining degree requirements.",
    };
  });

  return {
    summary: parsed.summary || "Here are eligible courses that fit your preferences.",
    recommendations,
    eligibleCount: eligible.length,
  };
}
