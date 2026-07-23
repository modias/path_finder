import { useEffect, useState } from "react";
import { REGISTRATION_CATALOG } from "./courseCatalog";

const STORAGE_KEY = "ds-pathway-schedule-v2";
const listeners = new Set();

function readSchedule() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function writeSchedule(next) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((fn) => fn(next));
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Parse "DTSC 2301" → { subject, number } */
export function parseCourseCode(code) {
  const match = String(code || "").trim().match(/^([A-Za-z]+)\s+(\d+[A-Za-z]*)$/);
  if (!match) return null;
  return { subject: match[1].toUpperCase(), number: match[2] };
}

/** Prefer an open section; otherwise first matching catalog section. */
export function findBestSection(subject, number) {
  const matches = REGISTRATION_CATALOG.filter(
    (c) => c.subject === subject && c.number === number
  );
  if (!matches.length) return null;
  return matches.find((c) => !c.full) || matches[0];
}

/**
 * Build an enrolled schedule row from a plan course like
 * { code: "DTSC 2301", title, credits }.
 */
export function planCourseToEnrolled(course) {
  const parsed = parseCourseCode(course.code);
  if (!parsed) return null;

  const section = findBestSection(parsed.subject, parsed.number);
  if (section) {
    return {
      id: section.crn,
      subject: section.subject,
      number: section.number,
      section: section.section,
      title: section.title,
      credits: section.credits,
    };
  }

  return {
    id: `plan-${parsed.subject}-${parsed.number}`,
    subject: parsed.subject,
    number: parsed.number,
    section: "001",
    title: course.title,
    credits: course.credits,
  };
}

export function useSchedule() {
  const [enrolled, setEnrolled] = useState(readSchedule);

  useEffect(() => subscribe(setEnrolled), []);

  const addEnrolled = (row) => {
    if (!row) return { ok: false, reason: "missing" };
    const current = readSchedule();
    if (current.some((c) => c.id === row.id || (c.subject === row.subject && c.number === row.number))) {
      return { ok: false, reason: "duplicate", row };
    }
    writeSchedule([...current, row]);
    return { ok: true, row };
  };

  const addFromPlanCourse = (course) => {
    const row = planCourseToEnrolled(course);
    if (!row) return { ok: false, reason: "invalid" };
    return addEnrolled(row);
  };

  const addFromSection = (section) => {
    if (!section) return { ok: false, reason: "missing" };
    if (section.full) return { ok: false, reason: "full", section };
    return addEnrolled({
      id: section.crn,
      subject: section.subject,
      number: section.number,
      section: section.section,
      title: section.title,
      credits: section.credits,
    });
  };

  const dropClass = (id) => {
    const current = readSchedule();
    const course = current.find((c) => c.id === id);
    writeSchedule(current.filter((c) => c.id !== id));
    return course || null;
  };

  const isOnSchedule = (courseOrCode) => {
    const code = typeof courseOrCode === "string" ? courseOrCode : courseOrCode?.code;
    const parsed = parseCourseCode(code);
    if (!parsed) return false;
    return enrolled.some((c) => c.subject === parsed.subject && c.number === parsed.number);
  };

  return {
    enrolled,
    addFromPlanCourse,
    addFromSection,
    dropClass,
    isOnSchedule,
  };
}
