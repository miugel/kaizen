import { describe, expect, it } from "vitest";
import { calculatePricing, getApplicableDiscountTypes } from "./pricing";

// Helpers to build dates without worrying about time-of-day
const date = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour, 0, 0, 0);

// A holiday from the list: May 2
const MAY_1 = date(2026, 5, 1);
const MAY_2 = date(2026, 5, 2); // holiday
const MAY_3 = date(2026, 5, 3);
const MAY_5 = date(2026, 5, 5);

// Non-holiday month for long-rental tests
const JAN_1 = date(2026, 1, 1);
const JAN_5 = date(2026, 1, 5); // 4 days later → 96 hrs

describe("calculatePricing", () => {
  describe("no discount", () => {
    it("returns the base price when no rules apply", () => {
      // 24 hours, no holiday
      const result = calculatePricing(JAN_1, date(2026, 1, 2), 10_000);

      expect(result.discountType).toBe("none");
      expect(result.discountLabel).toBeNull();
      expect(result.savingsAmountCents).toBe(0);
      expect(result.totalPriceCents).toBe(10_000 * 24);
      expect(result.effectiveHourlyRateCents).toBe(10_000);
      expect(result.baseHourlyRateCents).toBe(10_000);
    });

    it("does not apply long rental discount at exactly 72 hours", () => {
      const start = date(2026, 1, 1);
      const end = date(2026, 1, 4); // exactly 72 hrs (same hour-of-day)
      const result = calculatePricing(start, end, 10_000);

      expect(result.discountType).toBe("none");
    });
  });

  describe("holiday discount", () => {
    it("applies 17% off when reservation spans a holiday", () => {
      // May 1 → May 3 (24 hrs each side), holiday May 2 is strictly inside
      const result = calculatePricing(MAY_1, MAY_3, 10_000);
      const durationHrs = 48;
      const baseTotalCents = 10_000 * durationHrs; // 480_000

      expect(result.discountType).toBe("holiday");
      expect(result.discountLabel).toBe("17% holiday discount");
      expect(result.totalPriceCents).toBe(Math.round(baseTotalCents * 0.83));
      expect(result.savingsAmountCents).toBe(
        Math.round(baseTotalCents * 0.17),
      );
      expect(result.baseHourlyRateCents).toBe(10_000);
    });

    it("does not apply when reservation starts on the holiday", () => {
      // Starts on May 2 (the holiday) → no discount
      const result = calculatePricing(MAY_2, MAY_5, 10_000);

      expect(result.discountType).toBe("none");
    });

    it("does not apply when reservation ends on the holiday", () => {
      // Ends on May 2 (the holiday) → no discount
      const result = calculatePricing(MAY_1, MAY_2, 10_000);

      expect(result.discountType).toBe("none");
    });

    it("does not apply when reservation starts on holiday day regardless of time", () => {
      // Start at May 2 09:00 — startDay is May 2, so holiday == startDay → no discount.
      // End at May 4 09:00 (48 hrs) to avoid triggering long rental.
      const startOnHolidayMorning = date(2026, 5, 2, 9);
      const endBeforeLongRental = date(2026, 5, 4, 9); // 48 hrs later
      const result = calculatePricing(startOnHolidayMorning, endBeforeLongRental, 10_000);

      expect(result.discountType).toBe("none");
    });

    it("spans two holidays — still applies the single 17% discount", () => {
      // Jan 21 and Feb 12 are both holidays; reservation covers both
      const jan20 = date(2026, 1, 20);
      const feb13 = date(2026, 2, 13);
      const result = calculatePricing(jan20, feb13, 10_000);

      expect(result.discountType).toBe("holiday");
      expect(result.totalPriceCents).toBe(
        Math.round(10_000 * result.durationInHours * 0.83),
      );
    });
  });

  describe("long rental discount", () => {
    it("applies $10/hr off when duration exceeds 72 hours", () => {
      // Jan 1 → Jan 5 = 96 hours, no holidays in January range
      const result = calculatePricing(JAN_1, JAN_5, 10_000);
      const effectiveRate = 10_000 - 1_000; // $90/hr
      const expectedTotal = effectiveRate * 96;

      expect(result.discountType).toBe("long-rental");
      expect(result.discountLabel).toBe("$10/hr long rental discount");
      expect(result.effectiveHourlyRateCents).toBe(effectiveRate);
      expect(result.totalPriceCents).toBe(expectedTotal);
      expect(result.savingsAmountCents).toBe(1_000 * 96); // $10 saved per hour
    });

    it("does not apply at exactly 72 hours", () => {
      const start = date(2026, 1, 1, 12);
      const end = date(2026, 1, 4, 12); // 72 hrs exactly
      const result = calculatePricing(start, end, 10_000);

      expect(result.discountType).toBe("none");
    });
  });

  describe("conflict resolution — best price wins, only one applies", () => {
    // May 1 → May 5: 96 hours (> 72) and spans May 2 holiday → both rules fire

    it("applies long rental when it saves more (cheap vehicle)", () => {
      // $32/hr = 3_200 cents
      // Holiday:      3_200 * 96 * 0.83 = 254_976 cents
      // Long rental: (3_200 - 1_000) * 96 = 211_200 cents  ← lower
      const result = calculatePricing(MAY_1, MAY_5, 3_200);

      expect(result.discountType).toBe("long-rental");
      expect(result.totalPriceCents).toBe(2_200 * 96);
    });

    it("applies holiday when it saves more (expensive vehicle)", () => {
      // $220/hr = 22_000 cents
      // Holiday:      22_000 * 96 * 0.83 = 1_752_960 cents  ← lower
      // Long rental: (22_000 - 1_000) * 96 = 2_016_000 cents
      const result = calculatePricing(MAY_1, MAY_5, 22_000);

      expect(result.discountType).toBe("holiday");
      expect(result.totalPriceCents).toBe(Math.round(22_000 * 96 * 0.83));
    });

    it("never returns both discount types at once", () => {
      const cheap = calculatePricing(MAY_1, MAY_5, 3_200);
      const expensive = calculatePricing(MAY_1, MAY_5, 22_000);

      expect(cheap.discountType).not.toBe("none");
      expect(expensive.discountType).not.toBe("none");
      // Only a single winner is returned — never a combined/stacked result
      expect(["holiday", "long-rental"]).toContain(cheap.discountType);
      expect(["holiday", "long-rental"]).toContain(expensive.discountType);
      expect(cheap.discountType).not.toBe(expensive.discountType);
    });
  });
});

describe("getApplicableDiscountTypes", () => {
  it("returns empty array when no rules apply", () => {
    // 24 hours, no holiday
    expect(getApplicableDiscountTypes(JAN_1, date(2026, 1, 2))).toEqual([]);
  });

  it("returns ['holiday'] when only holiday applies", () => {
    // 48 hours, spans May 2
    expect(getApplicableDiscountTypes(MAY_1, MAY_3)).toEqual(["holiday"]);
  });

  it("returns ['long-rental'] when only long rental applies", () => {
    // 96 hours, no holiday
    expect(getApplicableDiscountTypes(JAN_1, JAN_5)).toEqual(["long-rental"]);
  });

  it("returns both types when both rules apply", () => {
    // 96 hours, spans May 2
    const types = getApplicableDiscountTypes(MAY_1, MAY_5);
    expect(types).toContain("holiday");
    expect(types).toContain("long-rental");
    expect(types).toHaveLength(2);
  });
});
