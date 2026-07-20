import { describe, expect, it } from "vitest";
import { ROI_CATEGORIES } from "./modules/types";
import { mergedCategoryOrder } from "./personas";

describe("mergedCategoryOrder", () => {
  it("returns the natural order when no personas are tagged", () => {
    expect(mergedCategoryOrder([])).toEqual([...ROI_CATEGORIES]);
  });

  it("leads with the tagged persona's top category (Section 7: CHRO leads with risk reduction)", () => {
    expect(mergedCategoryOrder(["CHRO"])[0]).toBe("RISK_REDUCED");
  });

  it("leads with time saved for the Recruiter/time-to-fill-adjacent metric alongside cost avoided", () => {
    const order = mergedCategoryOrder(["RECRUITER"]);
    expect(order[0]).toBe("COST_AVOIDED");
    expect(order[1]).toBe("TIME_SAVED");
  });

  it("merges multiple tagged personas by best (lowest) rank per category", () => {
    // CHRO wants RISK_REDUCED first; TALENT_HR wants TIME_SAVED first.
    // Both should outrank categories neither persona prioritizes highly.
    const order = mergedCategoryOrder(["CHRO", "TALENT_HR"]);
    expect(order.indexOf("RISK_REDUCED")).toBeLessThan(order.indexOf("REVENUE_ENABLED"));
    expect(order.indexOf("TIME_SAVED")).toBeLessThan(order.indexOf("REVENUE_ENABLED"));
  });

  it("ignores unknown persona keys rather than throwing", () => {
    expect(mergedCategoryOrder(["NOT_A_REAL_PERSONA"])).toEqual([...ROI_CATEGORIES]);
  });
});
