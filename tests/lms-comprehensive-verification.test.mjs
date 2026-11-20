import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(PROJECT_ROOT, ".challenger-cache");

let lmsModule = null;
let hemisModule = null;

test.before(async () => {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  execSync(
    `npx tsc --target es2022 --module esnext --moduleResolution bundler --outDir "${CACHE_DIR}" src/lib/lms.ts src/lib/hemis.ts`,
    { cwd: PROJECT_ROOT, stdio: "pipe" }
  );

  lmsModule = await import(path.join(CACHE_DIR, "lms.js"));
  hemisModule = await import(path.join(CACHE_DIR, "hemis.js"));
});

test("LMS-1: University Course Curricula & Modules Schema Completeness", () => {
  const { UNIVERSITY_COURSES } = lmsModule;
  assert.ok(Array.isArray(UNIVERSITY_COURSES), "Courses list must be an array");
  assert.ok(UNIVERSITY_COURSES.length >= 2, "Must contain at least Semester 1 and Semester 2 courses");

  for (const course of UNIVERSITY_COURSES) {
    assert.ok(course.id, "Course must have an ID");
    assert.ok(course.code, "Course must have an accredited code (e.g. FIZ-101)");
    assert.ok(course.title, "Course must have a title");
    assert.ok(course.totalCredits >= 3, "Course ECTS credits must be >= 3");
    assert.ok(course.modules.length >= 3, "Course must contain at least 3 academic modules");

    for (const mod of course.modules) {
      assert.ok(mod.id, "Module must have an ID");
      assert.ok(mod.title, "Module must have a title");
      assert.ok(mod.labKey, "Module must map to a physical laboratory key");
      assert.ok(mod.items.length >= 2, "Module must have learning items (theory/quiz/lab)");

      // Check item types
      for (const item of mod.items) {
        assert.ok(item.id, "Item must have an ID");
        assert.ok(item.title, "Item must have a title");
        assert.ok(
          ["theory", "pre_quiz", "lab", "post_quiz", "problem"].includes(item.itemType),
          `Invalid itemType: ${item.itemType}`
        );
      }
    }
  }
});

test("LMS-2: Prerequisite Locks & Linear Progression Guard", () => {
  const { UNIVERSITY_COURSES, checkModuleUnlockStatus } = lmsModule;
  const course = UNIVERSITY_COURSES[0]; // FIZ-101

  // Module 0 should ALWAYS be unlocked
  const mod0Status = checkModuleUnlockStatus(course, 0, new Set());
  assert.equal(mod0Status.isUnlocked, true, "First module must be unlocked by default");

  // Module 1 with empty completed set should be LOCKED
  const mod1Locked = checkModuleUnlockStatus(course, 1, new Set());
  assert.equal(mod1Locked.isUnlocked, false, "Module 1 must be locked when prerequisites not met");
  assert.ok(mod1Locked.reason && mod1Locked.reason.length > 5, "Must provide clear academic reason");

  // Module 1 with all Module 0 prerequisites completed should UNLOCK
  const completedMod0 = new Set(course.modules[0].items.map((it) => it.id));
  const mod1Unlocked = checkModuleUnlockStatus(course, 1, completedMod0);
  assert.equal(mod1Unlocked.isUnlocked, true, "Module 1 must unlock when all module 0 items are completed");
});

test("LMS-3: Student Rank, XP Milestones & Leveling Math", () => {
  const { calculateStudentRank } = lmsModule;
  const r0 = calculateStudentRank(0);
  assert.equal(r0.level, 1);
  assert.equal(r0.title, "Fizika Havaskori");
  assert.equal(r0.progressPercent, 0);

  const r1 = calculateStudentRank(650);
  assert.equal(r1.level, 2);
  assert.equal(r1.title, "Kichik Tadqiqotchi");
  assert.equal(r1.progressPercent, 30); // (650 - 500) / 500 = 150/500 = 30%

  const rHigh = calculateStudentRank(5200);
  assert.equal(rHigh.level, 11);
  assert.equal(rHigh.title, "Kvant Nazariyotchisi");
  assert.ok(rHigh.progressPercent >= 0 && rHigh.progressPercent <= 100);
});

test("LMS-4: Standard Lab Rubric Total Points Check", () => {
  const { STANDARD_LAB_RUBRIC } = lmsModule;
  assert.equal(STANDARD_LAB_RUBRIC.labKey, "standard");
  assert.equal(STANDARD_LAB_RUBRIC.criteria.length, 4, "Must have 4 standard grading criteria");

  const totalMax = STANDARD_LAB_RUBRIC.criteria.reduce((acc, c) => acc + c.maxPoints, 0);
  assert.equal(totalMax, 100, "Criteria max points must sum to exactly 100 (HEMIS scale)");
});

test("LMS-5: HEMIS Letter Grading Boundaries & ECTS Standards", () => {
  const { calculateHemisGrade } = hemisModule;
  assert.deepEqual(calculateHemisGrade(95), { letter: "A", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(90), { letter: "A", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(87), { letter: "B+", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(82), { letter: "B", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(76), { letter: "C+", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(71), { letter: "C", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(64), { letter: "D", status: "O‘tdi" });
  assert.deepEqual(calculateHemisGrade(58), { letter: "F", status: "Qayta topshirish (Debt)" });
  assert.deepEqual(calculateHemisGrade(0), { letter: "F", status: "Qayta topshirish (Debt)" });
});

test("LMS-6: HEMIS Gradebook CSV Exporter Schema & Delimiter Compliance", () => {
  const { generateHemisGradebookCsv } = hemisModule;
  const dummyRatings = [
    {
      studentId: "HEMIS-00042",
      fullName: "Anvar Qodirov",
      groupName: "FIZ-22/01",
      university: "O‘zbekiston Milliy Universiteti",
      faculty: "Fizika fakulteti",
      labScores: {
        kinematics: 88,
        dynamics: 95,
        statics: 92,
      },
      attendancePct: 100,
      totalJnScore: 91.7,
      letterGrade: "A",
      status: "O‘tdi",
    },
    {
      studentId: "HEMIS-00043",
      fullName: "Dilnoza Rahimova",
      groupName: "FIZ-22/01",
      university: "O‘zbekiston Milliy Universiteti",
      faculty: "Fizika fakulteti",
      labScores: {
        kinematics: 55,
      },
      attendancePct: 80,
      totalJnScore: 55.0,
      letterGrade: "F",
      status: "Qayta topshirish (Debt)",
    },
  ];

  const csv = generateHemisGradebookCsv(dummyRatings);
  assert.ok(csv.includes("Talaba ID (HEMIS)"), "CSV must include HEMIS header");
  assert.ok(csv.includes("Anvar Qodirov"), "CSV must contain student name");
  assert.ok(csv.includes("HEMIS-00042"), "CSV must contain student HEMIS ID");
  assert.ok(csv.includes("Qayta topshirish (Debt)"), "CSV must track debt status");

  const lines = csv.trim().split("\n");
  assert.equal(lines.length, 3, "1 header row + 2 data rows");
});
