import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  STAGES, ELECTIVES, SEMESTER_PLAN, REMAINING_REQUIREMENTS, CAREERS, TOTAL_CREDITS,
} from "../src/data/curriculum.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function buildSystemPrompt() {
  const curriculum = {
    program: "B.S. Data Science, UNC Charlotte School of Data Science",
    totalCredits: TOTAL_CREDITS,
    stages: STAGES,
    electives: ELECTIVES,
    semesterPlan: SEMESTER_PLAN,
    remainingRequirements: REMAINING_REQUIREMENTS,
    careers: CAREERS,
    notes: [
      "Core studio courses total 18 credit hours across four years.",
      "Support courses (computing and math) total 31 credit hours combined.",
      "Electives DTSC 4420, 4430, 4440 are proposed and not yet in the official catalog.",
      "Salary ranges on career cards are approximate entry-level U.S. national figures.",
    ],
  };

  return `You are a friendly academic advisor assistant for UNC Charlotte's B.S. Data Science program prototype app called "DS Pathway."

RULES:
- Answer ONLY using the curriculum data provided below. Do not invent course codes, credit hours, or requirements.
- If you are unsure or the question is outside the provided data, say: "I'm not sure about that — please confirm with your human advisor or DegreeWorks."
- Keep answers concise (2–4 short paragraphs max). Use bullet points for course lists.
- Be encouraging and student-friendly. Reference the student's reflection answers when provided.
- Always remind students this is a planning tool, not official degree certification.
- Do not provide legal, medical, or financial advice.

CURRICULUM DATA:
${JSON.stringify(curriculum, null, 2)}`;
}

function formatStudentContext(context = {}) {
  const lines = [];
  if (context.step != null) {
    lines.push(`Current app step: ${context.stepLabel || `Step ${context.step + 1}`}`);
  }
  if (context.selections) {
    const { interests = [], values = [], strengths = [] } = context.selections;
    if (interests.length) lines.push(`Student interests: ${interests.join(", ")}`);
    if (values.length) lines.push(`Student values: ${values.join(", ")}`);
    if (strengths.length) lines.push(`Student strengths: ${strengths.join(", ")}`);
  }
  if (context.note?.trim()) {
    lines.push(`Student reflection note: ${context.note.trim()}`);
  }
  if (context.careerTarget) {
    lines.push(`Suggested career target: ${context.careerTarget}`);
  }
  return lines.length ? `\n\nSTUDENT CONTEXT:\n${lines.join("\n")}` : "";
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, geminiConfigured: Boolean(genAI) });
});

app.post("/api/chat", async (req, res) => {
  if (!genAI) {
    return res.status(503).json({
      error: "Gemini API key not configured. Add GEMINI_API_KEY to a .env file in the project root.",
    });
  }

  const { message, history = [], context = {} } = req.body;
  if (!message?.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: buildSystemPrompt() + formatStudentContext(context),
    });

    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      })),
    });

    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({
      error: "Failed to get a response. Please try again.",
      detail: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Advisor API running on http://localhost:${PORT}`);
  if (!genAI) console.warn("Warning: GEMINI_API_KEY is not set.");
});
