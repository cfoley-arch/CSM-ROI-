import type { ModuleDefinition, ModuleResult } from "./types";
import { AtsModule } from "./ats";
import { RecruiterActivityModule } from "./recruiterActivity";

/**
 * Every module the calculator knows how to compute. Per Section 8, adding
 * Onboarding/Performance/LMS/Background Checks/Compensation later means
 * adding one entry here (plus its own folder under src/lib/modules/) — no
 * changes to the database shape, the account screens, or this file's shape.
 */
export const MODULE_REGISTRY: Record<string, ModuleDefinition> = {
  ATS: AtsModule as ModuleDefinition,
  RECRUITER_ACTIVITY: RecruiterActivityModule as ModuleDefinition,
};

export function getModule(moduleKey: string): ModuleDefinition {
  const mod = MODULE_REGISTRY[moduleKey];
  if (!mod) {
    throw new Error(`Unknown module key: ${moduleKey}`);
  }
  return mod;
}

export function listModules(): ModuleDefinition[] {
  return Object.values(MODULE_REGISTRY);
}

/**
 * Sums whichever modules are active for an account into the Grand Total
 * ROI Summary (Section 4's "Exec Slide").
 */
export function calculateGrandTotal(moduleResults: ModuleResult[]): {
  moduleResults: ModuleResult[];
  totalAnnualRoi: number;
} {
  return {
    moduleResults,
    totalAnnualRoi: moduleResults.reduce((sum, m) => sum + m.totalAnnualRoi, 0),
  };
}

export type { ClientContext, ModuleDefinition, ModuleResult, RoiCategory, RoiLineItem } from "./types";
