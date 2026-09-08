import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { checkEligibility, getEligibleCourses } from "./eligibility.js";

const emptyRecord = { completed: [], inProgress: [] };

const midProgramRecord = {
  completed: [
    "ITSC 1213",
    "ITSC 2175",
    "STAT 1222",
    "MATH 1241",
    "MATH 2164",
    "DTSC 1301",
    "DTSC 1302",
    "DTSC 2301",
    "DTSC 2302",
  ],
  inProgress: ["ITSC 2214", "DTSC 3601"],
};

describe("checkEligibility", () => {
  it("treats unverified courses as ineligible", () => {
    const result = checkEligibility("ITCS 4155", emptyRecord);
    assert.equal(result.eligible, false);
    assert.equal(result.unverified, true);
    assert.ok(result.missingPrereqs.some((m) => m.includes("not verified")));
  });

  it("treats verified-no-prereq electives as eligible", () => {
    const result = checkEligibility("ITCS 4123", emptyRecord);
    assert.equal(result.eligible, true);
    assert.equal(result.unverified, undefined);
  });

  it("blocks a course that is already in progress", () => {
    const result = checkEligibility("ITCS 3156", {
      completed: [],
      inProgress: ["ITCS 3156"],
    });
    assert.equal(result.eligible, false);
  });

  it("allows ITIS 4180 when ITSC 2214 is completed", () => {
    const result = checkEligibility("ITIS 4180", {
      completed: ["ITSC 2214"],
      inProgress: [],
    });
    assert.equal(result.eligible, true);
  });

  it("treats verified-no-prereq gen-ed courses as eligible", () => {
    const result = checkEligibility("WRDS 1103", emptyRecord);
    assert.equal(result.eligible, true);
    assert.equal(result.unverified, undefined);
  });

  it("blocks eligibility when prerequisites are missing", () => {
    const result = checkEligibility("STAT 2223", emptyRecord);
    assert.equal(result.eligible, false);
    assert.ok(result.missingPrereqs.some((m) => m.includes("STAT 1222")));
  });

  it("satisfies oneOf rules when any single listed course is completed", () => {
    const record = { completed: ["MATH 1241"], inProgress: [] };
    const result = checkEligibility("MATH 2164", record);
    assert.equal(result.eligible, true);
  });

  it("allows coreqs satisfied by inProgress courses", () => {
    const withoutCoreq = { completed: [], inProgress: [] };
    const blocked = checkEligibility("DTSC 1302", withoutCoreq);
    assert.equal(blocked.eligible, false);

    const withCoreqInProgress = {
      completed: ["STAT 1222"],
      inProgress: ["DTSC 1301"],
    };
    assert.equal(checkEligibility("DTSC 1302", withCoreqInProgress).eligible, true);

    const withCoreqCompleted = {
      completed: ["DTSC 1301", "STAT 1222"],
      inProgress: [],
    };
    assert.equal(checkEligibility("DTSC 1302", withCoreqCompleted).eligible, true);
  });

  it("blocks DTSC 1302 when only DTSC 1301 coreq is met (STAT oneOf missing)", () => {
    const record = { completed: [], inProgress: ["DTSC 1301"] };
    assert.equal(checkEligibility("DTSC 1302", record).eligible, false);
  });

  it("allows DTSC 1302 with DTSC 1301 in progress and STAT 1221 completed", () => {
    const record = {
      completed: ["STAT 1221"],
      inProgress: ["DTSC 1301"],
    };
    assert.equal(checkEligibility("DTSC 1302", record).eligible, true);
  });

  it("allows DTSC 1302 with DTSC 1301 in progress and STAT 1220 in progress", () => {
    const record = {
      completed: [],
      inProgress: ["DTSC 1301", "STAT 1220"],
    };
    assert.equal(checkEligibility("DTSC 1302", record).eligible, true);
  });

  it("does not recommend courses already completed", () => {
    const record = { completed: ["STAT 1222"], inProgress: [] };
    const result = checkEligibility("STAT 1222", record);
    assert.equal(result.eligible, false);
  });

  it("allows ITCS 3160 when ITSC 1213 is completed", () => {
    const result = checkEligibility("ITCS 3160", midProgramRecord);
    assert.equal(result.eligible, true);
  });

  it("requires ITSC 2214 completed before ITCS 3162 even if 2214 is in progress", () => {
    const result = checkEligibility("ITCS 3162", midProgramRecord);
    assert.equal(result.eligible, false);
  });

  it("allows ITSC 1213 when DTSC 1302 is completed and a MATH coreq is met", () => {
    const record = { completed: ["DTSC 1302", "MATH 1241"], inProgress: [] };
    assert.equal(checkEligibility("ITSC 1213", record).eligible, true);
  });

  it("blocks ITSC 1213 when DTSC 1302 is completed but no MATH coreq is met", () => {
    const record = { completed: ["DTSC 1302"], inProgress: [] };
    assert.equal(checkEligibility("ITSC 1213", record).eligible, false);
  });

  it("allows ITSC 1213 with DTSC 1302 completed and MATH 1103 in progress", () => {
    const record = {
      completed: ["DTSC 1302"],
      inProgress: ["MATH 1103"],
    };
    assert.equal(checkEligibility("ITSC 1213", record).eligible, true);
  });

  it("allows ITSC 1213 with DTSC 1302 completed and MATH 1100 completed", () => {
    const record = {
      completed: ["DTSC 1302", "MATH 1100"],
      inProgress: [],
    };
    assert.equal(checkEligibility("ITSC 1213", record).eligible, true);
  });

  it("allows ITSC 1213 with DTSC 1302 completed and MATH 1120 completed", () => {
    const record = {
      completed: ["DTSC 1302", "MATH 1120"],
      inProgress: [],
    };
    assert.equal(checkEligibility("ITSC 1213", record).eligible, true);
  });

  it("blocks DTSC 3601 when ITSC 2214 is only in progress", () => {
    assert.equal(checkEligibility("DTSC 3601", midProgramRecord).eligible, false);
  });

  it("blocks DTSC 2301 on an empty record", () => {
    assert.equal(checkEligibility("DTSC 2301", emptyRecord).eligible, false);
  });

  it("blocks DTSC 2301 when only DTSC 1301 is completed", () => {
    const record = { completed: ["DTSC 1301"], inProgress: [] };
    assert.equal(checkEligibility("DTSC 2301", record).eligible, false);
  });

  it("blocks DTSC 2301 when DTSC 1301 and 1302 are done but no STAT", () => {
    const record = { completed: ["DTSC 1301", "DTSC 1302"], inProgress: [] };
    assert.equal(checkEligibility("DTSC 2301", record).eligible, false);
  });

  it("accepts STAT 1220 as satisfying the DTSC 2301 stats prereq", () => {
    const record = {
      completed: ["DTSC 1301", "DTSC 1302", "STAT 1220"],
      inProgress: ["DTSC 2302"],
    };
    assert.equal(checkEligibility("DTSC 2301", record).eligible, true);
  });

  it("blocks DTSC 2302 when DTSC 2301 is not completed or in progress", () => {
    const record = {
      completed: ["DTSC 1301", "DTSC 1302", "STAT 1222"],
      inProgress: [],
    };
    assert.equal(checkEligibility("DTSC 2302", record).eligible, false);
  });

  it("allows DTSC 2302 when all prereqs are met and DTSC 2301 is in progress", () => {
    const record = {
      completed: ["DTSC 1301", "DTSC 1302", "STAT 1221"],
      inProgress: ["DTSC 2301"],
    };
    assert.equal(checkEligibility("DTSC 2302", record).eligible, true);
  });
});

describe("getEligibleCourses", () => {
  const miniCatalog = [
    { subject: "STAT", number: "1222", title: "Intro Statistics" },
    { subject: "STAT", number: "2223", title: "Statistics II" },
    { subject: "ITCS", number: "3160", title: "Databases" },
    { subject: "ITCS", number: "4155", title: "Software Projects" },
  ];

  it("returns only eligible catalog entries", () => {
    const record = { completed: ["STAT 1222"], inProgress: [] };
    const eligible = getEligibleCourses(miniCatalog, record);
    const codes = eligible.map((c) => `${c.subject} ${c.number}`);
    assert.ok(codes.includes("STAT 2223"));
    assert.ok(!codes.includes("ITCS 4155"));
    assert.ok(!codes.includes("ITCS 3160"));
  });
});
