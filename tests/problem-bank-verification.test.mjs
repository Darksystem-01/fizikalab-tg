import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

function loadTsModule(relativePath) {
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(PROJECT_ROOT, relativePath);

  const code = fs.readFileSync(fullPath, "utf8");
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  });

  const m = { exports: {} };
  const fn = new Function("module", "exports", "require", transpiled.outputText);
  fn(m, m.exports, (mod) => {
    return require(mod);
  });
  return m.exports;
}

const problemsModule = loadTsModule("src/lib/physics/problems.ts");
const { PHYSICS_PROBLEMS, getProblemsByChapter, checkProblemAnswer } = problemsModule;

test("PB-1: Problem Bank Total Volume and Chapter Distribution (400 problems)", () => {
  assert.equal(PHYSICS_PROBLEMS.length, 400, "Must contain exactly 400 university physics problems");

  const chapters = [
    "metrology",
    "kinematics",
    "dynamics",
    "statics",
    "electromagnetism",
    "optics",
    "thermodynamics",
    "atomic",
  ];

  for (const ch of chapters) {
    const list = getProblemsByChapter(ch);
    assert.equal(list.length, 50, `Chapter ${ch} must contain exactly 50 problems`);
  }
});

test("PB-2: Structural Schema Integrity & Non-Empty Fields across all 400 problems", () => {
  const seenIds = new Set();

  for (const p of PHYSICS_PROBLEMS) {
    // Unique IDs
    assert.ok(!seenIds.has(p.id), `Duplicate problem ID detected: ${p.id}`);
    seenIds.add(p.id);

    // Schema validations
    assert.ok(p.id && p.id.startsWith("prob-"), "ID must match prob- format");
    assert.ok(p.title && p.title.length > 5, "Title must be descriptive");
    assert.ok(p.statement && p.statement.length > 20, "Statement must have full context");
    assert.ok(p.targetSymbol && p.targetSymbol.length > 0, "Target symbol must exist");
    assert.ok(p.targetUnit && p.targetUnit.length > 0, "Target unit must exist");
    assert.ok(typeof p.correctAnswer === "number" && !isNaN(p.correctAnswer) && isFinite(p.correctAnswer), "Correct answer must be finite number");
    assert.ok(p.tolerancePct > 0 && p.tolerancePct <= 5, "Tolerance must be realistic (0 < tol <= 5%)");
    assert.ok(p.formulaLatex && p.formulaLatex.length > 3, "Formula LaTeX must exist");
    assert.ok(Array.isArray(p.stepByStepSolution) && p.stepByStepSolution.length >= 2, "Must have step-by-step solution");
    assert.ok(Array.isArray(p.hints) && p.hints.length >= 1, "Must have at least one hint");
    assert.ok(Object.keys(p.given).length >= 1, "Must have given parameters");
  }
});

test("PB-3: Zero-Error Auto-Grader Verification on exact answers (400/400 Pass)", () => {
  for (const p of PHYSICS_PROBLEMS) {
    const res = checkProblemAnswer(p.id, p.correctAnswer);
    assert.equal(res.isCorrect, true, `Exact answer for ${p.id} must be marked correct`);
    assert.equal(res.errorPct, 0, `Exact answer error must be 0%`);
  }
});

test("PB-4: Auto-Grader Tolerance Boundaries & Rejection of Incorrect Answers", () => {
  // Test within tolerance
  const p1 = PHYSICS_PROBLEMS[0];
  const withinTol = p1.correctAnswer * (1 + (p1.tolerancePct * 0.5) / 100);
  const resTol = checkProblemAnswer(p1.id, withinTol);
  assert.equal(resTol.isCorrect, true, "Answer within tolerance must pass");

  // Test outside tolerance
  const outsideTol = p1.correctAnswer * (1 + (p1.tolerancePct * 2.5) / 100);
  const resOut = checkProblemAnswer(p1.id, outsideTol);
  assert.equal(resOut.isCorrect, false, "Answer outside tolerance must be rejected");
  assert.ok(resOut.feedbackUz.includes("Noto‘g‘ri"), "Feedback must indicate incorrect answer");
});
