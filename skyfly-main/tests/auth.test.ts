import test from "node:test";
import assert from "node:assert/strict";
import { ProfileUpdateSchema } from "../packages/shared/src/schemas.js";

test("Authentication & Profile Validation Suite", async (t) => {
  await t.test("validates valid profile update payload", () => {
    const valid = {
      fullName: "Pooja Sharma",
      bio: "JEE 2026 aspirant focusing on Physics and Mathematics",
      studentType: "school",
      institution: "Delhi Public School",
      gradeOrYear: "Class 12",
      skills: ["Calculus", "Kinematics", "Organic Chemistry"],
    };

    const result = ProfileUpdateSchema.safeParse(valid);
    assert.equal(result.success, true);
  });

  await t.test("rejects invalid student type", () => {
    const invalid = {
      studentType: "kindergarten",
    };

    const result = ProfileUpdateSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  await t.test("rejects excessively long bio exceeding max limits", () => {
    const invalid = {
      bio: "A".repeat(501),
    };

    const result = ProfileUpdateSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });
});
