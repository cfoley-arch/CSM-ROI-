import { describe, expect, it } from "vitest";
import { computeNetRoi } from "./netRoi";

describe("computeNetRoi", () => {
  it("subtracts platform cost from gross ROI when platform cost is set", () => {
    expect(computeNetRoi(76403, 30844)).toEqual({ netAnnualRoi: 76403 - 30844, platformCostPerYear: 30844 });
  });

  it("returns null (not zero) when platform cost hasn't been entered, so the UI can distinguish 'unset' from 'free'", () => {
    expect(computeNetRoi(76403, null)).toEqual({ netAnnualRoi: null, platformCostPerYear: null });
  });
});
