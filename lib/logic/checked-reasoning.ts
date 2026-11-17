import checked from "./checked-examples.json";

export type LogicalExample = (typeof checked.examples)[number];
export type LogicalReasoning = typeof checked;
const conceptExamples: Readonly<Record<string, readonly string[]>> = checked.concept_examples;

/** Checked symbolic schemas are separate from graph assertions and definitions. */
export function conceptLogicalReasoning(slug: string): LogicalReasoning | null {
  const ids = conceptExamples[slug];
  if (!ids) return null;
  return { ...checked, examples: checked.examples.filter((item) => ids.includes(item.id)) };
}
