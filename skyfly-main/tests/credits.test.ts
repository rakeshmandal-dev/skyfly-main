import test from "node:test";
import assert from "node:assert/strict";
import { CreditAwardSchema, CreditSpendSchema } from "../packages/shared/src/schemas.js";

test("Credit Accounting & Eligibility Rules Suite", async (t) => {
  await t.test("allows genuine learning activity awards", () => {
    const valid = {
      activity: "quiz_completed",
      refKey: "attempt-12345",
      description: "Completed Physics kinematics quiz",
    };

    const result = CreditAwardSchema.safeParse(valid);
    assert.equal(result.success, true);
  });

  await t.test("rejects arbitrary unapproved activity names", () => {
    const invalid = {
      activity: "free_money_click",
    };

    const result = CreditAwardSchema.safeParse(invalid);
    assert.equal(result.success, false);
  });

  await t.test("validates credit spend with positive integer amount", () => {
    const validSpend = {
      amount: 15,
      purpose: "AI detailed PDF chapter translation",
    };

    const result = CreditSpendSchema.safeParse(validSpend);
    assert.equal(result.success, true);
  });

  await t.test("rejects zero or negative credit spend amounts", () => {
    const zeroSpend = { amount: 0, purpose: "test" };
    const negativeSpend = { amount: -10, purpose: "test" };

    assert.equal(CreditSpendSchema.safeParse(zeroSpend).success, false);
    assert.equal(CreditSpendSchema.safeParse(negativeSpend).success, false);
  });
});
