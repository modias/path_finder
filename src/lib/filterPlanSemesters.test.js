import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { filterPlanSemesters, filterSemesterCourses } from "./filterPlanSemesters.js";

describe("filterSemesterCourses", () => {
  it("blocks DTSC 2301 without 1301/1302", () => {
    const courses = [
      { code: "DTSC 2301", title: "Modeling I", category: "required", credits: 3 },
      { code: "DTSC 2302", title: "Modeling II", category: "required", credits: 3 },
    ];
    const kept = filterSemesterCourses(courses, {
      completed: ["DTSC 1301"],
      inProgress: [],
    });
    assert.deepEqual(kept, []);
  });

  it("allows DTSC 2301 + 2302 together once 1301, 1302, and STAT are done", () => {
    const courses = [
      { code: "DTSC 2301", title: "Modeling I", category: "required", credits: 3 },
      { code: "DTSC 2302", title: "Modeling II", category: "required", credits: 3 },
    ];
    const kept = filterSemesterCourses(courses, {
      completed: ["DTSC 1301", "DTSC 1302", "STAT 1222"],
      inProgress: [],
    });
    assert.deepEqual(
      kept.map((c) => c.code),
      ["DTSC 2301", "DTSC 2302"]
    );
  });
});

describe("filterPlanSemesters", () => {
  it("drops completed and in-progress courses", () => {
    const filtered = filterPlanSemesters(
      [
        {
          term: "Fall",
          courses: [
            { code: "DTSC 1301", title: "Data A", category: "required", credits: 3 },
            { code: "STAT 2223", title: "Stats II", category: "required", credits: 3 },
          ],
        },
      ],
      {
        completed: ["DTSC 1301", "STAT 1222"],
        inProgress: [],
      }
    );
    assert.deepEqual(
      filtered[0].courses.map((c) => c.code),
      ["STAT 2223"]
    );
  });

  it("lets Spring unlock DTSC 3601 after Fall plans 2301/2302", () => {
    const filtered = filterPlanSemesters(
      [
        {
          term: "Fall",
          courses: [
            { code: "DTSC 2301", title: "Modeling I", category: "required", credits: 3 },
            { code: "DTSC 2302", title: "Modeling II", category: "required", credits: 3 },
          ],
        },
        {
          term: "Spring",
          courses: [
            { code: "DTSC 3601", title: "Predictive I", category: "required", credits: 3 },
            { code: "DTSC 3602", title: "Predictive II", category: "required", credits: 3 },
          ],
        },
      ],
      {
        completed: ["DTSC 1301", "DTSC 1302", "STAT 1222", "ITSC 2214"],
        inProgress: [],
      }
    );

    assert.deepEqual(
      filtered[0].courses.map((c) => c.code),
      ["DTSC 2301", "DTSC 2302"]
    );
    assert.deepEqual(
      filtered[1].courses.map((c) => c.code),
      ["DTSC 3601", "DTSC 3602"]
    );
  });

  it("does not put 2301 on the plan before 1301 and 1302 are completed", () => {
    const filtered = filterPlanSemesters(
      [
        {
          term: "Fall",
          courses: [
            { code: "DTSC 2301", title: "Modeling I", category: "required", credits: 3 },
            { code: "DTSC 1301", title: "Data A", category: "required", credits: 3 },
          ],
        },
      ],
      { completed: [], inProgress: [] }
    );
    const codes = filtered[0].courses.map((c) => c.code);
    assert.ok(codes.includes("DTSC 1301"));
    assert.ok(!codes.includes("DTSC 2301"));
  });

  it("trims each semester to the credit load, keeping required courses first", () => {
    const filtered = filterPlanSemesters(
      [
        {
          term: "Fall",
          courses: [
            { code: "DTSC 2301", title: "Modeling I", category: "required", credits: 3 },
            { code: "DTSC 2302", title: "Modeling II", category: "required", credits: 3 },
            { code: "STAT 2223", title: "Stats II", category: "required", credits: 3 },
            { code: "LBST 2101", title: "Western Culture", category: "general_ed", credits: 3 },
          ],
        },
      ],
      { completed: ["DTSC 1301", "DTSC 1302", "STAT 1222"], inProgress: [] },
      { creditLoad: 9 }
    );
    assert.deepEqual(
      filtered[0].courses.map((c) => c.code),
      ["DTSC 2301", "DTSC 2302", "STAT 2223"]
    );
  });
});
