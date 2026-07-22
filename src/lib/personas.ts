import { ROI_CATEGORIES, type RoiCategory } from "./modules/types";

/**
 * Section 7's persona-aware framing, resolved "yes" for v1 (Section 9,
 * #10): "the CSM can tag the audience persona(s)... and the narrative/
 * layout shifts emphasis." Deliberately presentation-only — categoryOrder
 * decides which ROI categories the statement leads with; it never touches
 * the calc engine's numbers.
 */
export interface Persona {
  key: string;
  label: string;
  cares: string;
  anchor: string;
  /** Categories in the order this persona wants to see them, most important first. */
  categoryPriority: RoiCategory[];
}

export const PERSONAS: Persona[] = [
  {
    key: "CHRO",
    label: "CHRO",
    cares: "Board-level, defensible business impact",
    anchor: "Total $ value, risk reduction, retention",
    categoryPriority: ["RISK_REDUCED", "COST_AVOIDED", "REVENUE_ENABLED", "TIME_SAVED"],
  },
  {
    key: "TALENT_HR",
    label: "VP/Dir of Talent or HR",
    cares: "Program success, proving ROI to their own execs",
    anchor: "Time saved, adoption metrics",
    categoryPriority: ["TIME_SAVED", "COST_AVOIDED", "REVENUE_ENABLED", "RISK_REDUCED"],
  },
  {
    key: "RECRUITER",
    label: "VP/Dir of Recruiting",
    cares: "Speed & quality",
    anchor: "Time-to-fill, recruiter efficiency",
    categoryPriority: ["COST_AVOIDED", "TIME_SAVED", "REVENUE_ENABLED", "RISK_REDUCED"],
  },
  {
    key: "LD",
    label: "VP/Dir of L&D",
    cares: "Skills, adoption, training ROI",
    anchor: "LMS module, training cost avoided",
    categoryPriority: ["COST_AVOIDED", "TIME_SAVED", "REVENUE_ENABLED", "RISK_REDUCED"],
  },
];

export function getPersona(key: string): Persona | undefined {
  return PERSONAS.find((p) => p.key === key);
}

/**
 * Merges the tagged personas' category orders: a category is promoted if
 * ANY tagged persona ranks it highly. With no personas tagged, categories
 * render in their natural (module-defined) order.
 */
export function mergedCategoryOrder(personaKeys: string[]): RoiCategory[] {
  if (personaKeys.length === 0) return [...ROI_CATEGORIES];

  const bestRank = new Map<RoiCategory, number>();
  for (const key of personaKeys) {
    const persona = getPersona(key);
    if (!persona) continue;
    persona.categoryPriority.forEach((category, rank) => {
      const existing = bestRank.get(category);
      if (existing === undefined || rank < existing) bestRank.set(category, rank);
    });
  }

  return [...ROI_CATEGORIES].sort((a, b) => (bestRank.get(a) ?? 99) - (bestRank.get(b) ?? 99));
}
