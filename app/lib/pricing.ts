export type DiscountType = "holiday" | "long-rental" | "none";

export interface PricingResult {
  totalPriceCents: number;
  effectiveHourlyRateCents: number;
  baseHourlyRateCents: number;
  durationInHours: number;
  discountType: DiscountType;
  discountLabel: string | null;
  savingsAmountCents: number;
}

const HOLIDAY_DISCOUNT_MULTIPLIER = 0.83;
const LONG_RENTAL_THRESHOLD_HOURS = 72;
const LONG_RENTAL_DISCOUNT_PER_HOUR_CENTS = 1_000;

const HOLIDAYS = [
  { month: 1, day: 21 },
  { month: 2, day: 12 },
  { month: 3, day: 4 },
  { month: 5, day: 2 },
  { month: 6, day: 16 },
  { month: 7, day: 26 },
  { month: 8, day: 3 },
  { month: 9, day: 1 },
  { month: 11, day: 5 },
  { month: 12, day: 18 },
] as const;

function getDurationInHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

function holidayFallsInsideReservation(start: Date, end: Date): boolean {
  const startDayTs = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
  ).getTime();
  const endDayTs = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
  ).getTime();

  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    for (const { month, day } of HOLIDAYS) {
      const holidayTs = new Date(year, month - 1, day).getTime();
      if (holidayTs > startDayTs && holidayTs < endDayTs) {
        return true;
      }
    }
  }
  return false;
}

interface DiscountRule {
  type: Exclude<DiscountType, "none">;
  label: string;
  applies: (start: Date, end: Date, durationInHours: number) => boolean;
  compute: (
    baseTotalCents: number,
    baseHourlyRateCents: number,
    durationInHours: number,
  ) => { totalPriceCents: number; effectiveHourlyRateCents: number };
}

// Add new entries here to extend pricing logic.
const DISCOUNT_RULES: DiscountRule[] = [
  {
    type: "holiday",
    label: "17% holiday discount",
    applies: (start, end) => holidayFallsInsideReservation(start, end),
    compute: (baseTotalCents, _baseHourlyRateCents, durationInHours) => {
      const totalPriceCents = Math.round(
        baseTotalCents * HOLIDAY_DISCOUNT_MULTIPLIER,
      );
      return {
        totalPriceCents,
        effectiveHourlyRateCents: Math.round(totalPriceCents / durationInHours),
      };
    },
  },
  {
    type: "long-rental",
    label: "$10/hr long rental discount",
    applies: (_start, _end, durationInHours) =>
      durationInHours > LONG_RENTAL_THRESHOLD_HOURS,
    compute: (_baseTotalCents, baseHourlyRateCents, durationInHours) => {
      const effectiveHourlyRateCents =
        baseHourlyRateCents - LONG_RENTAL_DISCOUNT_PER_HOUR_CENTS;
      return {
        totalPriceCents: effectiveHourlyRateCents * durationInHours,
        effectiveHourlyRateCents,
      };
    },
  },
];

export function calculatePricing(
  start: Date,
  end: Date,
  baseHourlyRateCents: number,
): PricingResult {
  const durationInHours = getDurationInHours(start, end);
  const baseTotalCents = baseHourlyRateCents * durationInHours;

  const applicable = DISCOUNT_RULES.filter((rule) =>
    rule.applies(start, end, durationInHours),
  );

  if (applicable.length === 0) {
    return {
      totalPriceCents: baseTotalCents,
      effectiveHourlyRateCents: baseHourlyRateCents,
      baseHourlyRateCents,
      durationInHours,
      discountType: "none",
      discountLabel: null,
      savingsAmountCents: 0,
    };
  }

  const candidates = applicable.map((rule) => ({
    rule,
    ...rule.compute(baseTotalCents, baseHourlyRateCents, durationInHours),
  }));

  const best = candidates.reduce((a, b) =>
    a.totalPriceCents <= b.totalPriceCents ? a : b,
  );

  return {
    totalPriceCents: Math.round(best.totalPriceCents),
    effectiveHourlyRateCents: Math.round(best.effectiveHourlyRateCents),
    baseHourlyRateCents,
    durationInHours,
    discountType: best.rule.type,
    discountLabel: best.rule.label,
    savingsAmountCents: Math.round(baseTotalCents - best.totalPriceCents),
  };
}

export function getApplicableDiscountTypes(
  start: Date,
  end: Date,
): Exclude<DiscountType, "none">[] {
  const durationInHours = getDurationInHours(start, end);
  return DISCOUNT_RULES.filter((rule) =>
    rule.applies(start, end, durationInHours),
  ).map((rule) => rule.type);
}
